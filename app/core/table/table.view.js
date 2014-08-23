define([
  "app",
  "backbone",
  "core/table/table.headview",
  "core/table/table.bodyview",
  "core/table/table.footerview",
  "jquery-ui"
],

function(app, Backbone, TableHead, TableBody, TableFooter) {

  "use strict";

  var TableView = Backbone.Layout.extend({

    tagname: 'div',
    attributes: {'class':'directus-table-container'},
    template: 'tables/table',

    TableBody: TableBody,

    serialize: function() {
      var blacklist = this.options.blacklist || [];
      var columns = _.filter(this.collection.getColumns(), function(col) {
        return !_.contains(blacklist, col);
      });

      return {
        columns: columns,
        id: this.collection.table.id,
        selectable: this.options.selectable,
        sortable: this.options.sortable,
        showEmptyMessage: (this.collection.length === 0 && !this.options.hideEmptyMessage)
      };
    },

    events: {
      'click tbody td:not(.check):not(.status):not(.sort)' : function(e) {
        var id = $(e.target).closest('tr').attr('data-id');
        if (this.options.navigate) {
          $(document).scrollTop(0);
          this.collection.off();
          this.navigate(id);
        }
      }
    },

    navigate: function(id) {
      var route = Backbone.history.fragment.split('/');
      route.push(id);
      app.router.go(route);
    },

    selection: function() {
      var selection = [];
      $('td.check > input:checked').each(function() { selection.push(parseInt(this.value,10)); });
      return selection;
    },

    beforeRender: function() {
      var options;
      this.startRenderTime = new Date().getTime();

      if (this.tableHead) {
        options = this.options;
        this.insertView('table', new TableHead(options));
      }

      if (this.collection.length > 0) {
        options = _.pick(this.options, 'collection', 'selectable', 'filters', 'preferences', 'structure', 'sort', 'deleteColumn', 'rowIdentifiers', 'saveAfterDrop', 'blacklist', 'highlight');
        this.insertView('table', new this.TableBody(options));
      }

      if (this.collection.length > 0 && this.collection.table.get('footer') && this.options.footer !== false) {
        options = this.options;
        this.insertView('table', new TableFooter(options));
      }
    },

    afterRender: function() {
      var now = new Date().getTime();
      //console.log('rendered table ' + this.collection.table.id + ' in '+ (now-this.startRenderTime)+' ms');
    },

    initializeDrop: function() {
      //Cache a reference to the this.$el
      var $el = this.$el;
      var collection = this.collection;
      var saveAfterDrop = this.saveAfterDrop;

      // This timer prevent's the overlay to flicker when dragleave leaves for
      // a child item that triggers dragenter again.
      var timer;

      // If collection supports dnd
      // Since dragenter sux, this is how we do...
      $el.on('dragover', function(e) {
        clearInterval(timer);
        e.stopPropagation();
        e.preventDefault();
        $el.addClass('dragover');
      });

      $el.on('dragleave', function(e) {
          clearInterval(timer);
          timer = setInterval(function(){
            $el.removeClass('dragover');
            console.log('leave');
            clearInterval(timer);
          },50);
      });

      // Since data transfer is not supported by jquery...
      // XHR2, FormData
      this.el.ondrop = _.bind(function(e) {
        e.stopPropagation();
        e.preventDefault();

        app.sendFiles(e.dataTransfer.files, function(data) {
          _.each(data, function(item) {
            item.user = app.users.getCurrentUser().id;
            item[app.statusMapping.status_name] = app.statusMapping.active_num;

            if (saveAfterDrop) {
              //@todo: update collection status count
              collection.create(item);
            } else {
              console.log('ADD');
              collection.add(item, {nest: true, parse: true});
            }
          });
        });
        $el.removeClass('dragover');
      }, this);
    },

    initialize: function(options) {
      var collection = this.collection;

      this.listenTo(collection, 'sync', function(model, resp, options) {
        if (options.silent) return;
        this.render();
      });

      this.listenTo(collection, 'visibility', function() {
        this.render();
      });

      this.options.preferences = this.options.preferences || this.collection.preferences;
      this.options.structure = this.options.structure || this.collection.structure;
      this.options.table = this.options.table || this.collection.table;

      if (this.options.tableHead !== false) {
        this.tableHead = true;
      }

      if(collection.length > 0) {
        this.tableHead = true;
      }

      if (this.options.sort === undefined) {
        this.options.sort = collection.hasColumn('sort') && collection.hasPermission && collection.hasPermission('bigedit') && !collection.isWriteBlacklisted('sort');
      }

      if (this.options.selectable === undefined) {
        this.options.selectable = true;
      }

      this.saveAfterDrop = this.options.saveAfterDrop = (options.saveAfterDrop !== undefined) ?  options.saveAfterDrop : true;

      if (this.options.droppable || collection.droppable) {
        this.initializeDrop();
      }
    },

    constructor: function (options) {
      // Add events from child
      if (this.events) {
        this.events = _.defaults(this.events, TableView.prototype.events);
      }
      Backbone.Layout.__super__.constructor.call(this, options);
    }
  });

  return TableView;

});
