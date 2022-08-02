const axios = require('axios').default;

var express = require('express');
var router = express.Router();

var client = { debug: true, init: true };
var renew;

router.use(function(req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	next();
});

router.get('/', function(req, res, next) {
	res.json({ debug: client.debug });
});

router.get('/test', async (req, res) => {
	if (req.query.code) {
		client.code = req.query.code;
	}
	if (req.query.client_id) {
		client.client_id = req.query.client_id;
	}
	if (req.query.referer) {
		client.host = req.query.referer;
	}
	if (req.query.client_secret) {
		client.client_secret = req.query.client_secret;
	}
	
	if (req.query.code && req.query.client_id && req.query.referer && client.client_secret) await init(client);
	
	res.json(client.debug ? client : {});
});

if (client.debug) {
	router.get('/test/refresh', async (req, res) => {
		var response = await auth(client, false);
		res.json(response);
	});
}

router.get('/test/leads/:id', async (req, res) => {
	try {
		if (client.init) return res.json({ error: 'init not ended' });
		
		var id = req.params.id;
		
		var catalog_result = await axios.get('https://' + client.host + '/api/v4/catalogs?name=Products', {
			headers: {
				'Authorization': 'Bearer '+client.access_token,
				'Content-Type': 'application/json'
			}
		});
		
		var catalog_id = catalog_result.data._embedded.catalogs[0].id;
		
		if (!catalog_id) return res.json({ error: 'cant find products catalog id!' });
		
		var catalog_elements_result = await axios.get('https://' + client.host + '/api/v4/leads/' + id + '/links?to_entity_type=catalog_elements&metadata[catalog_id]=' + catalog_id, {
			headers: {
				'Authorization': 'Bearer '+client.access_token,
				'Content-Type': 'application/json'
			}
		});
		
		var catalog_elements = catalog_elements_result.data._embedded.links || [];
		
		var result = [];
		for (let elem of catalog_elements) {
			var elements_result = await axios.get('https://' + client.host + '/api/v4/catalogs/' + catalog_id + '/elements/' + elem.to_entity_id, {
				headers: {
					'Authorization': 'Bearer '+client.access_token,
					'Content-Type': 'application/json'
				}
			});
			if (elements_result.data) {
				elements_result.data.count = elem.metadata.quantity;
				result.push(elements_result.data);
			}
		}
		
		return res.json(result);
		
	} catch (err) {
		console.error(err);
	}
});

async function auth(client, flag) {
	try {
		var data = {};
		data.client_id = client.client_id;
		data.client_secret = client.client_secret;
		data.grant_type = flag ? 'authorization_code' : 'refresh_token';
		if (flag) {
			data.code = client.code;
		} else data.refresh_token = client.refresh_token;
		data.redirect_uri = 'https://sys.polypha.ga/test';
		
		var result = await axios.post('https://' + client.host + '/oauth2/access_token', data, {
			headers: {
				'Content-Type': 'application/json'
			}
		});
		if (result.status !== 200) return { status: result.status };
		
		client.access_token = result.data.access_token;
		client.refresh_token = result.data.refresh_token;
		client.expires_in = new Date(new Date().getTime() + result.data.expires_in*1000).getTime();
		renew = setTimeout(auth, result.data.expires_in - 60*60, client, false);
		
		return { status: 200 };
	} catch (err) {
		console.error(err);
	}
}

async function init(client) {
	await auth(client, true);
	client.init = false;
}

module.exports = router;
