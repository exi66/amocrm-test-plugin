define(['jquery', 'lib/components/base/modal'], function ($, Modal) {
  'use strict';

  return function () {
    var self = this;

    this.callbacks = {
      render: function () {
		    console.log('render');
        self.render_template({
          body: '',
          caption: {
            class_name: 'my-caption'
          },
          render: '<button type="button" class="my-button button-input">Список товаров</button>'
        });
		$('.my-button').on('click', function () {
          var page = window.location.pathname.split('/');
          var id = page.pop() || page.pop();
          var res = $.ajax({
            url: 'https://sys.polypha.ga/test/leads/'+id,
            type: 'GET',
            dataType: 'json',
            async : false,
            cache: false,
            timeout: 10000
          });
          if (res.responseJSON.error) {
            console.error(res.responseJSON.error);
          }
          var data = '<h1>Товары</h1><ul>';
          for (let elem of res.responseJSON) {
            data += `<li><a href="${elem._links.self.href}">${elem.name}</a> x${elem.count}</li>`
          }
          data += '</ul>';
          var modal = new Modal({
              class_name: 'modal-window',
              init: function ($modal_body) {
                  var $this = $(this);
                  $modal_body
                      .trigger('modal:loaded')
                      .html(data)
                      .trigger('modal:centrify')
                      .append('');
              },
              destroy: function () {

              }
          });
        })		
        return true;
      },

      init: function () {
        return true;
      },

      bind_actions: function () {
        return true;
      },

      settings: function () {
        return true;
      },

      onSave: function () {
        return true;
      }
    };
  };
});
