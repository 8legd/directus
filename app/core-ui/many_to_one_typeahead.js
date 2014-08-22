//  Many To One core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com
/*jshint multistr: true */

define(['app', 'backbone', 'core/UIView'], function(app, Backbone, UIView) {

  "use strict";

  var Module = {};

  Module.id = 'many_to_one_typeahead';
  Module.dataTypes = ['INT'];

  Module.variables = [
    {id: 'visible_column', ui: 'textinput', char_length: 64, required: true},
    {id: 'size', ui: 'select', options: {options: {'large':'Large','medium':'Medium','small':'Small'} }},
    {id: 'template', ui: 'textinput'}
  ];

  var template = '<input type="text" value="{{value}}" class="for_display_only" {{#if readonly}}readonly{{/if}}/> \
                  <style> \
                    .tt-hint {padding:6px 8px;} \
                    #edit_field_{{name}} .twitter-typeahead {\
                      width:100%;\
                    }\
                    #edit_field_{{name}} .tt-dropdown-menu { \
                      padding: 3px 0; \
                      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2); \
                      -webkit-border-radius: 2px; \
                      -moz-border-radius: 2px; \
                      border-radius: 2px; \
                      background-color: #fff; \
                  } \
                  #edit_field_{{name}} .tt-suggestions { \
                    margin-right: 0 !important; \
                  } \
                  \
                  #edit_field_{{name}} .tt-suggestion { \
                    display: block; \
                    padding: 3px 20px; \
                    clear: both; \
                    font-weight: normal; \
                    white-space: nowrap; \
                    font-size: 12px; \
                    margin-right: 0 !important; \
                } \
                \
                #edit_field_{{name}} .tt-is-under-cursor { \
                    color: white; \
                    background-color: black; \
                }\
                </style>';

  Module.Input = UIView.extend({

    tagName: 'div',

    attributes: {
      'class': 'field'
    },

    events: {},

    template: Handlebars.compile(template),

    serialize: function() {
      var relatedModel = this.model.get(this.name);
      var value = '';
      // The item is not new, it has a value
      if (!relatedModel.isNew()) {
        value = relatedModel.get(this.visibleCoumn);
      }

      return {
        name: this.options.name,
        size: this.columnSchema.options.get('size'),
        readonly: false,
        comment: this.options.schema.get('comment'),
        value: value
      };
    },

    afterRender: function () {
      var template = this.columnSchema.options.get('template');
      var self = this;

      var fetchItems = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.obj.whitespace('value'),
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        prefetch: app.API_URL + 'tables/' + this.collection.table.id + '/typeahead/?columns=' + this.visibleCoumn,
      });

      fetchItems.initialize();

      this.$(".for_display_only").typeahead({
        minLength: 1,
        items: 5,
        valueKey: this.visibleCoumn,
        template: Handlebars.compile('<div>'+template+'</div>')
      },
      {
        name: 'related-items',
        displayKey: 'value',
        source: fetchItems.ttAdapter()
      });

      this.$('.for_display_only').on('typeahead:selected', function(e, datum) {
        var model = self.model.get(self.name);
        var selectedId = parseInt(datum.id,10);

        model.clear();
        model.set({id: selectedId});
      });

    },

    initialize: function(options) {
      this.visibleCoumn = this.columnSchema.options.get('visible_column');
      var value = this.model.get(this.name);
      this.collection = value.collection.getNewInstance({omit: ['preferences']});
    }

  });

  Module.validate = function(value, options) {};

  Module.list = function(options) {
    if (options.value === undefined) return '';
    if (options.value instanceof Backbone.Model) return options.value.get(options.settings.get('visible_column'));
    return options.value;
  };

  return Module;
});