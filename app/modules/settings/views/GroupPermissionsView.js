//  permissions.js
//  Directus 6.0

//  (c) RANGER
//  Directus may be freely distributed under the GNU license.
//  For all details and documentation:
//  http://www.getdirectus.com

define([
  'app',
  'backbone',
  'core/BasePageView',
  'core/widgets/widgets'
],

function(app, Backbone, BasePageView, Widgets, SchemaManager) {

  "use strict";

  var GroupPermissions = {};

  GroupPermissions.Collection = Backbone.Collection.extend({

    getExpandedPermissions: function() {
    }

  });

  var EditFieldsOverlay = BasePageView.extend({
    headerOptions: {
      route: {
        title: 'Edit Fields',
        isOverlay: true
      }
    },

    events: {
      'click #removeOverlay': function() {
        app.router.removeOverlayPage(this);
      }
    },

    afterRender: function() {
      this.setView('#page-content', this.contentView);
    },

    initialize: function(options) {
      this.contentView = new EditFields({model: this.model});
    }
  });

  var EditFields = Backbone.Layout.extend({
    template: 'modules/settings/settings-grouppermissions-editfield',

    events: {
      'click td > span': function(e) {
        var $target = $(e.target),
            $tr = $target.closest('tr');

        var readBlacklist = (this.model.get('read_field_blacklist')) ? this.model.get('read_field_blacklist').split(',') : [];
        var writeBlacklist = (this.model.get('write_field_blacklist')) ? this.model.get('write_field_blacklist').split(',') : [];


        this.toggleIcon($target);

        //Removing so add to blacklist
        if($target.parent().hasClass('delete-color')) {
          if($target.parent().parent().data('value') == "read") {
            if(readBlacklist.indexOf($tr.data('column-name')) === -1) {
              readBlacklist.push($tr.data('column-name'));
              this.model.set({read_field_blacklist: readBlacklist.join(",")});
            }
          } else {
            if(writeBlacklist.indexOf($tr.data('column-name')) === -1) {
              writeBlacklist.push($tr.data('column-name'));
              this.model.set({write_field_blacklist: writeBlacklist.join(",")});
            }
          }
        } else {
          if($target.parent().parent().data('value') == "read") {
            if(readBlacklist.indexOf($tr.data('column-name')) !== -1) {
              readBlacklist.splice(readBlacklist.indexOf($tr.data('column-name')), 1);
              this.model.set({read_field_blacklist: readBlacklist.join(",")});
            }
          } else {
            if(writeBlacklist.indexOf($tr.data('column-name')) !== -1) {
              writeBlacklist.splice(writeBlacklist.indexOf($tr.data('column-name')), 1);
              this.model.set({write_field_blacklist: writeBlacklist.join(",")});
            }
          }
        }

        this.model.save();
      }
    },

    toggleIcon: function($span) {
      $span.parent().toggleClass('add-color').toggleClass('delete-color');
      $span.toggleClass('icon-block').toggleClass('icon-check');
    },

    serialize: function() {
      var data = {columns: []};
      var readBlacklist = (this.model.get('read_field_blacklist') || '').split(',');
      var writeBlacklist = (this.model.get('write_field_blacklist') || '').split(',');

      data.columns = app.schemaManager.getColumns('tables', this.model.get('table_name'))
            .filter(function(model) {if(model.id === 'id') {return false;} return true;})
            .map(function(model) {
              return {column_name: model.id, read: (readBlacklist.indexOf(model.id) == -1), write: (writeBlacklist.indexOf(model.id) == -1)};
            }, this);

      return data;
    },

    initialize: function(options) {
      this.render();
    }
  });

  var EditActiveOverlay = BasePageView.extend({
    headerOptions: {
      route: {
        title: 'Edit Active',
        isOverlay: true
      }
    },

    events: {
      'click #removeOverlay': function() {
        app.router.removeOverlayPage(this);
      }
    },

    afterRender: function() {
      this.setView('#page-content', this.contentView);
    },

    initialize: function(options) {
      this.contentView = new EditActive({model: this.model});
    }
  });

  var EditActive = Backbone.Layout.extend({
    template: 'modules/settings/settings-grouppermissions-editactive',

    events: {
      'click td > span': function(e) {
        var $target = $(e.target),
            $tr = $target.closest('tr');

        var allowedStatus = (this.model.get('allowed_status') || '').split(',');
        if(allowedStatus.length === 1 && allowedStatus[0] === '') {
          allowedStatus = [];
        }
        this.toggleIcon($target);

        //Removing so remove from allowed active
        if($target.parent().hasClass('delete-color')) {
          if(allowedStatus.indexOf($tr.data('state-id')) !== -1) {
            allowedStatus.splice(allowedStatus.indexOf($tr.data('state-id')), 1);
            this.model.set({allowed_status: allowedStatus.join(",")});
          }
        } else {
          if(allowedStatus.indexOf($tr.data('state-id')) === -1) {
            allowedStatus.push($tr.data('state-id'));
            this.model.set({allowed_status: allowedStatus.join(",")});
          }
        }

        this.model.save();
      }
    },

    toggleIcon: function($span) {
      $span.parent().toggleClass('add-color').toggleClass('delete-color');
      $span.toggleClass('icon-block').toggleClass('icon-check');
    },

    serialize: function() {
      var data = {states: []};
      var allowedStatus = (this.model.get('allowed_status') || '').split(',');
      if(allowedStatus.length === 1 && allowedStatus[0] === '') {
        allowedStatus = [];
      }
      var that = this;
      data.states = app.statusMapping.mapping.map(function(state, stateId) {
        state.id = stateId;
        state.enabled = false;

        if(allowedStatus.indexOf(stateId.toString()) !== -1) {
          state.enabled = true;
        }

        return state;
      });

      return data;
    },

    initialize: function(options) {
      this.render();
    }
  });

  GroupPermissions.Permissions = BasePageView.extend({
    headerOptions: {
      route: {
        title: 'Settings'
      },
    },

    template: 'modules/settings/settings-grouppermissions',

    events: {
      'click td.editActive > span': 'editActive',
      'click td.editFields > span': 'editFields',
      'click td > span': function(e) {
        var $target = $(e.target).parent(),
            $tr = $target.closest('tr'),
            permissions, cid, attributes, model;

        if($target.hasClass('editFields')) {
          return;
        }

        cid = $tr.data('cid');
        model = this.collection.get(cid);

        if(this.selectedState == 'all' && this.collection.where({table_name: model.get('table_name'), group_id: model.get('group_id')}).length > 1) {
          var without = [];
          var additional = [];


          if($target.hasClass('big-priv')) {
            without.push($target.parent().data('value'));
            without.push('big' + $target.parent().data('value'));
          } else if($target.hasClass('has-privilege')) {
            additional.push('big' + $target.parent().data('value'));
            without.push($target.parent().data('value'));
          } else {
            without.push('big' + $target.parent().data('value'));
            additional.push($target.parent().data('value'));
          }

          this.collection.each(function(cmodel) {
            if(cmodel.get('table_name') == model.get('table_name') && cmodel.get('group_id') == model.get('group_id')) {
              var perms = cmodel.get('permissions').split(',');
              perms = _.difference(perms, without);
              perms = _.union(perms, additional);
              perms = _.compact(perms);
              cmodel.set('permissions', perms.join(','));
              cmodel.save();
            }
          });

          return;
        }

        this.toggleIcon($target, this.collection.get(cid).get('permissions'));

        attributes = this.parseTablePermissions($tr, this.collection.get(cid).get('permissions'));

        var fancySave = false;
        var oldModel = model;
        if(this.selectedState != "all" && model.get('status_id') != this.selectedState) {
          model = model.clone();
          this.model = model;
          model.collection = oldModel.collection;
          fancySave = true;
        }
        model.set(attributes);
        var that = this;
        model.save({activeState: this.selectedState}, {success: function(res) {
          if(fancySave) {
            that.collection.add(that.model);
          }
        }});
      }
    },

    toggleIcon: function($span, currentPermission) {
      var dataValue = $span.parent().data('value');
      if($span.hasClass('yellow-color')) {
        $span.addClass('big-priv');
      } else {
        $span.toggleClass('add-color').toggleClass('delete-color').toggleClass('has-privilege');
      }
    },

    parseTablePermissions: function($tr) {
      var permissions;

      permissions = $tr.children().has('span.has-privilege');


      permissions = permissions.map(function() { return (($(this).has('span.big-priv').length) ? "big" : "") +  $(this).data('value');}).get().join();

      return {permissions: permissions};
    },

    editFields: function(e) {
      var $target = $(e.target).parent(),
        $tr = $target.closest('tr'),
        cid, model;

        cid = $tr.data('cid');

      var model = this.collection.get(cid);
      //@todo: link real col
      var view = new EditFieldsOverlay({model: model});
      app.router.overlayPage(view);
    },

    editActive: function(e) {
      var $target = $(e.target).parent(),
        $tr = $target.closest('tr'),
        cid, model;

        cid = $tr.data('cid');

      var model = this.collection.get(cid);

      var view = new EditActiveOverlay({model: model});
      app.router.overlayPage(view);
    },

    updatePermissionList: function(value) {
      this.selectedState = value;
      this.render();
    },

    serialize: function() {
      var collection = this.collection;
      var that = this;

      collection = collection.filter(function(model) {
        if(that.selectedState != 'all') {
          var test = app.schemaManager.getColumns('tables', model.get('table_name'));
          if(test) {
            test = test.find(function(hat){return hat.id == app.statusMapping.status_name;});
            if(test) {
              return true;
            }
          }
          return false;
        }
        return true;
      });

      var tableStatusMapping = {};

      collection.forEach(function(priv) {
        if(!tableStatusMapping[priv.get('table_name')]) {
          tableStatusMapping[priv.get('table_name')] = {count: 0};
        }
        if(priv.get('status_id')) {
          tableStatusMapping[priv.get('table_name')][priv.get('status_id')] = priv;
        } else {
          tableStatusMapping[priv.get('table_name')][that.selectedState] = priv;
        }

        if(!tableStatusMapping[priv.get('table_name')][that.selectedState]) {
          tableStatusMapping[priv.get('table_name')][that.selectedState] = priv;
        }

        tableStatusMapping[priv.get('table_name')].count++;
      });

      // Create data structure suitable for view
      collection = [];

      for(var prop in tableStatusMapping) {
        collection.push(tableStatusMapping[prop][this.selectedState]);
      }

      var tableData = [];
      collection.forEach(function(model) {
        var permissions, read_field_blacklist,
            write_field_blacklist, data, defaultPermissions;

        data = model.toJSON();
        data.cid = model.cid;
        data.title = app.capitalize(data.table_name, '_', true);

        //If table has active column, show active edit
        if(app.schemaManager.getColumns('tables', data.table_name)) {
          if(app.schemaManager.getColumns('tables', data.table_name).get(app.statusMapping.status_name)) {
            data.showActiveEdit = true;
          }
        }

        permissions = (model.get('permissions') || '').split(',');

        data.hasReadBlacklist = false;
        data.hasWriteBlacklist = false;

        // Default permissions
        data.permissions = {
          'add': false,
          'edit': false,
          'bigedit': false,
          'delete': false,
          'bigdelete': false,
          'alter': false,
          'view': false,
          'bigview': false
        };

        _.each(permissions, function(property) {
          if (data.permissions.hasOwnProperty(property)) {
            data.permissions[property] = true;
          }
        });
        if(that.selectedState == 'all' && tableStatusMapping[data.table_name].count > 1) {
          var viewValConsistent = true;
          var lastView = (!data.permissions.bigview) ? ((!data.permissions.view) ? 0 : 1) : 2;
          var addValConsistent = true;
          var lastAdd = data.permissions.add;
          var editValConsistent = true;
          var lastEdit = (!data.permissions.bigedit) ? ((!data.permissions.edit) ? 0 : 1) : 2;
          var deleteValConsistent = true;
          var lastDelete = (!data.permissions.bigdelete) ? ((!data.permissions.delete) ? 0 : 1) : 2;
          for(var prop in tableStatusMapping[data.table_name]) {
            if(prop == 'all' || prop == 'count') {
              continue;
            }
            var permissions = tableStatusMapping[data.table_name][prop].get('permissions').split(',');

            if(addValConsistent) {
              addValConsistent = ((permissions.indexOf('add') > -1) == lastAdd);
            }

            if(viewValConsistent) {
              if(permissions.indexOf('bigview') > -1) {
                if(lastView != 2) {
                  viewValConsistent = false;
                }
              }
              else if(permissions.indexOf('view') > -1) {
                if(lastView != 1) {
                  viewValConsistent = false;
                }
              }
              else if(lastView != 0) {
                viewValConsistent = false;
              }
            }

            if(editValConsistent) {
              if(permissions.indexOf('bigedit') > -1) {
                if(lastEdit != 2) {
                  editValConsistent = false;
                }
              }
              else if(permissions.indexOf('edit') > -1) {
                if(lastEdit != 1) {
                  editValConsistent = false;
                }
              }
              else if(lastEdit != 0) {
                editValConsistent = false;
              }
            }

            if(deleteValConsistent) {
              if(permissions.indexOf('bigdelete') > -1) {
                if(lastDelete != 2) {
                  deleteValConsistent = false;
                }
              }
              else if(permissions.indexOf('delete') > -1) {
                if(lastDelete != 1) {
                  deleteValConsistent = false;
                }
              }
              else if(lastDelete != 0) {
                viewValConsistent = false;
              }
            }
          }

          data.permissions.addValConsistent = !addValConsistent;
          data.permissions.viewValConsistent = !viewValConsistent;
          data.permissions.editValConsistent = !editValConsistent;
          data.permissions.deleteValConsistent = !deleteValConsistent;
        }

        /*
        Don't blacklist columns yet
        read_field_blacklist = (model.get('read_field_blacklist') || '').split();
        write_field_blacklist = (model.get('write_field_blacklist') || '').split();

        data.blacklist = app.columns[data.table_name].map(function(model) {
          var readBlacklist = _.contains(read_field_blacklist, model.id);
          var writeBlacklist = _.contains(write_field_blacklist, model.id);

          if (readBlacklist) {
            data.hasReadBlacklist = true;
            data.hasWriteBlacklist = true;
          }

          return {
            column_name: model.id,
            read: readBlacklist,
            write: writeBlacklist
          };
        });
        */

        tableData.push(data);
      });

      return {tables: tableData};
    },

    initialize: function() {
      this.selectedState = "all";
      this.collection.on('sync', this.render, this);
    }
  });

  var StatusSelectWidget = Backbone.Layout.extend({
    template: Handlebars.compile('\
    <div class="simple-select dark-grey-color simple-gray right"> \
      <span class="icon icon-triangle-down"></span> \
      <select id="statusSelect" name="status" class="change-visibility"> \
        <optgroup label="Status"> \
          <option data-status value="all">All States</option> \
          {{#mapping}} \
            <option data-status value="{{id}}">View {{capitalize name}}</option> \
          {{/mapping}} \
        </optgroup> \
      </select> \
    </div>'),

    tagName: 'div',
    attributes: {
      'class': 'tool'
    },

    events: {
      'change #statusSelect': function(e) {
        var $target = $(e.target).find(":selected");
        if($target.attr('data-status') !== undefined && $target.attr('data-status') !== false) {
          this.baseView.updatePermissionList($(e.target).val());
          //var value = $(e.target).val();
          //var name = {currentPage: 0};
          //name[app.statusMapping.status_name] = value;
          //this.collection.setFilter(name);
        }
      }
    },

    serialize: function() {
      var data = {mapping: []};
      var mapping = app.statusMapping.mapping;

      for(var key in mapping) {
        //Do not show option for deleted status
        if(key != app.statusMapping.deleted_num) {
          data.mapping.push({id: key, name: mapping[key].name});
        }
      }
      return data;
    },

    afterRender: function() {
      //$('#visibilitySelect').val(this.collection.preferences.get(app.statusMapping.status_name));
    },
    initialize: function(options) {
      this.baseView = options.baseView;
    }
  });

  GroupPermissions.Page = BasePageView.extend({
    headerOptions: {
      route: {
        title: 'Settings',
        breadcrumbs: [{title: 'Settings', anchor: '#settings'}, {title: 'Permissions', anchor: '#settings/permissions'}]
      },
    },
    rightToolbar: function() {
      this.statusSelect = new StatusSelectWidget({baseView: this.view});
      return [
        this.statusSelect
      ];
    },
    afterRender: function() {
      this.setView('#page-content', this.view);
      this.collection.fetch();
      //this.insertView('#sidebar', new PaneSaveView({model: this.model, single: this.single}));
    },
    initialize: function() {
      this.headerOptions.route.title = this.options.title;
      this.view = new GroupPermissions.Permissions({collection: this.collection});
    }

  });

  return GroupPermissions;
});