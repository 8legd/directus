//  Date core UI component
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

// Attribute          Type              Contains                                Example
// -------------------------------------------------------------------------------------------------------------------------------------
// options.schema     Backbone.Model    Structure/Schema for this table row     options.schema.get('type') [column_name, comment, type]
// options.model      Backbone.Model    Data/Model for this table row           options.model.get('id') [any column in current table row]
// options.value      String            Value for this field
// options.settings   Backbone.Model    Saved values for current UI options     options.settings.get('length') [any key from this UI options]
// options.name       String            Field name
/*jshint multistr: true */


define(['app', 'backbone', 'moment'], function(app, Backbone, moment) {

  "use strict";

  var Module = {};

  Module.id = 'date';
  Module.dataTypes = ['DATE'];

  Module.variables = [
    {id: 'readonly', ui: 'checkbox'}
  ];

  var template =  '<style type="text/css"> \
                  input.date { \
                    display: inline; \
                    display: -webkit-inline-flex; \
                    width: 132px; \
                    padding-right: 4px; \
                    margin-right: 5px; \
                  } \
                  </style> \
                  <input type="date" class="date" {{#if readonly}}disabled{{/if}} name="{{name}}" id="{{name}}" {{#if hasDate}}value="{{valueDate}}"{{/if}}> \
                  <a class="now secondary-info">Now</a>';

  Module.Input = Backbone.Layout.extend({

    tagName: 'div',
    attributes: {
      'class': 'field'
    },

    template: Handlebars.compile(template),

    events: {
      'click .now': 'makeNow'
    },

    makeNow: function() {
      this.value = moment();
      this.render();
    },

    serialize: function() {
      var data = {};

      data.hasDate = this.value.isValid();
      data.valueDate = this.value.format('YYYY-MM-DD');
      data.name = this.options.name;
      data.note = this.options.schema.get('comment');

      data.readonly = !this.options.canWrite;

      return data;
    },

    initialize: function() {
      this.value = moment(this.options.value);
    }

  });

  Module.validate = function(value) {
    //
  };

  Module.list = function(options) {
    return moment(options.value).format('DD-MMM-YYYY');
  };

  return Module;

});