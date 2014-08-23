define([
  'app',
  'backbone',
  'core/PreferenceModel'
],
function(app, Backbone, PreferenceModel) {

  "use strict";

  return Backbone.Layout.extend({
    template: Handlebars.compile('\
    <div class="left snapshotOption" id="saveSnapshotBtn"><span class="icon icon-camera"></span></div> \
    {{#if hasActiveColumn}} \
    <div class="simple-select dark-grey-color simple-gray left"> \
      <span class="icon icon-triangle-down"></span> \
      <select id="visibilitySelect" name="status" class="change-visibility"> \
        <optgroup label="Status"> \
          <option data-status {{#if allKeysSelected}}selected{{/if}} value="{{allKeys}}">View All</option> \
          {{#mapping}} \
            <option data-status {{#if selected}}selected{{/if}} value="{{id}}">View {{capitalize name}}</option> \
          {{/mapping}} \
        </optgroup> \
      </select> \
      <select id="template" style="display:none;width:auto;"><option id="templateOption"></option></select> \
    </div> \
    {{/if}}'),

    tagName: 'div',
    attributes: {
      'class': 'tool'
    },

    events: {
      'change #visibilitySelect': function(e) {
        var $target = $(e.target).find(":selected");
        if($target.attr('data-status') !== undefined && $target.attr('data-status') !== false) {
          var value = $(e.target).val();
          var name = {currentPage: 0};
          name.visible_status = value;
          this.collection.setFilter(name);

          console.log(this.collection);

          this.listenToOnce(this.collection.preferences, 'sync', function() {
            if(this.basePage) {
              this.basePage.removeHolding(this.cid);
            }
            if(this.defaultId) {
              this.collection.preferences.set({title:null, id: this.defaultId});
            }
          });
        }
      },
      'click #saveSnapshotBtn': 'saveSnapshot',
    },

    saveSnapshot: function() {
      var that = this;
      app.router.openModal({type: 'prompt', text: 'Please enter a name for your Snapshot', callback: function(name ) {
        if(name === null || name === "") {
          alert('Please Fill In a Valid Name');
          return;
        }

        //Save id so it can be reset after render
        that.defaultId = that.collection.preferences.get('id');
        //Unset Id so that it creates new Preference
        that.collection.preferences.unset('id');
        that.collection.preferences.set({title: name});
        that.collection.preferences.save();
        that.pinSnapshot(name);

        that.listenToOnce(that.collection.preferences, 'sync', function() {
          if(this.basePage) {
            that.basePage.removeHolding(this.cid);
          }
          if(this.defaultId) {
            that.collection.preferences.set({title:null, id: that.defaultId});
          }
        });
      }});
    },

    pinSnapshot: function(title) {
      var data = {
        title: title,
        url: Backbone.history.fragment + "/pref/" + title,
        icon_class: 'icon-search',
        user: app.users.getCurrentUser().get("id"),
        section: 'search'
      };
      if(!app.getBookmarks().isBookmarked(data.title)) {
        app.getBookmarks().addNewBookmark(data);
      }
    },

    serialize: function() {
      var data = {hasActiveColumn: this.options.hasActiveColumn, mapping: []};
      var mapping = app.statusMapping.mapping;
      console.log();
      var collection = this.collection;
      var keys = [];
      mapping.forEach(function(item) {
        if(item.id.toString() == collection.preferences.get('visible_status')) {
          item.selected = true;
        } else {
          item.selected = false;
        }
        data.mapping.push(item);
        keys.push(item.id);
      });

      data.mapping.sort(function(a, b) {
        if(a.sort < b.sort) {
          return -1;
        }
        if(a.sort > b.sort) {
          return 1;
        }
        return 0;
      });

      data.allKeys = keys.join(',');
      if(data.allKeys == collection.preferences.get('visible_status')) {
        data.allKeysSelected = true;
      } else {
        data.allKeysSelected = false;
      }
      return data;
    },

    initialize: function() {
      var activeTable = this.collection.table.id;

      this.basePage = this.options.basePage;

      if(this.collection.table.columns.get(app.statusMapping.status_name)) {
        this.options.hasActiveColumn = true;
      }

      if(app.router.loadedPreference) {
        this.defaultId = this.collection.preferences.get('id');
        this.collection.preferences.fetch({newTitle: app.router.loadedPreference});
        if(this.basePage) {
          this.basePage.addHolding(this.cid);
        }

        this.listenToOnce(this.collection.preferences, 'sync', function() {
          if(this.basePage) {
            this.basePage.removeHolding(this.cid);
          }
          if(this.defaultId) {
            this.collection.preferences.set({title:null, id: this.defaultId});
          }
        });
      }
    }
  });
});