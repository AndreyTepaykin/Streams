(function (Q, $) {

/**
 * Streams Tools
 * @module Streams-tools
 * @main
 */

/**
 * Interface for managing access to a given stream
 * @class Streams access
 * @constructor
 */
Q.Tool.define("Streams/access", function(options) {
	if (!options) {
		throw new Q.Exception("options required");
	}
	Q.addStylesheet('{{Streams}}/css/tools/access.css');

    /*Q.Text.get('Assets/content', function (err, text) {

    });*/

	if (!options.tab) {
		options.tab = 'read';
	}
	var tool = this, state = this.state,
		element, levelForEveryone, fieldName,
		actionText, tempSelect, onActivateHandler;

	function prepareSelect($select, criteria, value, action) {
		if (!state.stream) return;
		if (!action) {
			action = 'access';
		}

		if (typeof value !== 'undefined') {
			$select.val(value);
			$select.prop('name', 'cloned');
			$select.on("change", function () {
				var fields = {
					publisherId: state.stream.fields.publisherId,
					streamName: state.stream.fields.name
				};
				fields[fieldName] = $(this).val();
				Q.extend(fields, criteria);
				Q.req('Streams/access', ['data'], function (err, response) {
					var msg;
					if (msg = Q.firstErrorMessage(err, response && response.errors)) {
						alert(msg);
					}
					state.stream.refresh();
				}, {
					method: 'put',
					fields: fields
				});
			});
		}
		return $select;
	}

	function newRemoveLink(criteria) {
		if (!state.stream) return;
		var link = $('<a href="#remove" />').click(function () {
			var $this = $(this);
			var fields = {
				publisherId: state.stream.fields.publisherId,
				streamName: state.stream.fields.name,
			};
			fields[fieldName] = -1;
			Q.extend(fields, criteria);
			
			Q.req('Streams/access', ['data'], function (err, response) {
				var msg;
				if (msg = Q.firstErrorMessage(err, response && response.errors)) {
					alert(msg);
				}
				$this.closest('.Streams_access_for_item').remove();
				if (criteria.ofUserId) {
					delete tool.child('Streams_userChooser').exclude[criteria.ofUserId];
				} else if (criteria.ofContactLabel) {
					$('option', tempSelect).each(function () {
						if ($(this).val() === criteria.ofContactLabel) {
							$(this).appendTo($('.Streams_access_levelAddLabel', element));
							return false;
						}
					});
				}
			}, {
				method: 'put',
				fields: fields
			});
			return false;
		})

		for (var k in criteria) {
			link.data(k, criteria[k]);
		}
		return link;
	}

	function addAccessRow(access, avatar) {
		var userId = access.ofUserId;
		var contactLabel = access.ofContactLabel;

		if ((!contactLabel && !userId) || access[fieldName] < 0) {
			return;
		}

		var clonedSelect = levelForEveryone.clone();
		var criteria;
		if (userId !== "") {
			if (!avatar) {
				avatar = new Q.Streams.Avatar(state.avatarArray[userId]);
				if (!avatar) {
					console.warn("Streams/access tool: avatar missing for user with id " + userId);
					return;
				}
			}
			criteria = { ofUserId: userId };
			tool.child('Streams_userChooser').exclude[userId] = true;
		} else if (contactLabel) {
			criteria = {ofContactLabel: contactLabel};
			$('.Streams_access_levelAddLabel option', element).each(function () {
				if ($(this).val() == contactLabel) {
					$(this).closest('select').val('');
					$(this).appendTo(tempSelect);
					return false;
				}
			});
		} else {
			return;
		}

		prepareSelect(clonedSelect, criteria, access[fieldName]);
		var labelAccessDiv = $('<div class="Streams_access_for_item"/>');
		if (userId !== "") {
			var label = state.labels[contactLabel];
			var src = Q.Users.iconUrl(state.icons[contactLabel], 40);
			var icon = $('<img />').attr('src', src).css('width', 20)

			labelAccessDiv.append(
				$('<div class="Streams_access_for_text"/>')
				.append($('<div class="Streams_access_for_icon"/>').append(icon))
				.append($('<div class="Streams_access_for_name"/>').append(label).append(avatar.displayName() + ' ' + actionText + ' '))
			).append(
				$('<div class="Streams_access_for_select"/>').append(clonedSelect)
			).append(
				$('<div class="Streams_access_for_remove"/>').append(newRemoveLink(criteria))
			).appendTo($('.Streams_access_user_array', element));

		} else {
			var label = state.labels[contactLabel];
			var src = Q.Users.iconUrl(state.icons[contactLabel], 40);
			var icon = $('<img />').attr('src', src);
			labelAccessDiv.append(
				$('<div class="Streams_access_for_text"/>')
				.append($('<div class="Streams_access_for_icon"/>').append(icon))
				.append($('<div class="Streams_access_for_name"/>').append(label).append(' ' + actionText + ' '))
			).append(
				$('<div class="Streams_access_for_select"/>').append(clonedSelect)
			).append(
				$('<div class="Streams_access_for_remove"/>').append(newRemoveLink(criteria))
			).appendTo($('.Streams_access_label_array', element));
		}
		clonedSelect.focus();
	}

	if (!state.publisherId) {
		return;
	}
	
	function _initialize() {
		var tabsTool = tool.child("Q_tabs");
		var ts = tabsTool.state;

		tabsTool.indicateCurrent = function(tab) {
			if(!tab && ts.tab != null && ts.tab.length != 0) {
				$tab = ts.tab;
				tab = $tab.data('name');
			} else if(tab) {
				$tab = $('[data-name="'+tab+'"]', $(tabsTool.element));
			} else {
				$tab = $('[data-name="'+ts.defaultTabName+'"]', $(tabsTool.element));
			}
			
			tabsTool.$tabs.removeClass('Q_current Q_tabs_switchingTo Q_tabs_switchingFrom');
			$tab.addClass('Q_current');

			ts.tab = $tab;
			ts.tabName = tab;
			Q.handle(ts.onCurrent, tabsTool, [$tab, state.tabName]);
		}

		ts.loaderOptions = Q.extend({}, 10, Q.loadUrl.options, 10, ts.loaderOptions, {
			quiet: true,
			loadExtras: false,
			ignorePage: true,
			ignoreDialogs: true,
			slotNames: {replace: ['control', 'extra']},
			loader: null,
			slotContainer: function (name, response) {
				if (name === 'control') {
					return tool.$('.Streams_access_controls')[0];
				}
				if (!response) return;

				var extra = response.slots.extra;
				Q.Streams.Stream.construct(extra.stream, {}, null);
				state.avatarArray = extra.avatarArray;
				state.accessArray = extra.accessArray;
				state.labels = extra.labels;
				state.icons = extra.icons;
			}
		});
		
		var tabName = ts.tabName;
		element            = tool.element,
		levelForEveryone   = $('.Streams_access_levelForEveryone', element),
		fieldName          = (tabName != null ? tabName : 'read')+'Level',
		actionText         = (tabName === 'read' || tabName == null) ? 'can see' : 'can',
		tempSelect         = $('<select />');
		tool.child('Streams_userChooser').exclude = state.avatarArray;
		Q.Streams.retainWith(tool)
		.get(tool.state.publisherId, tool.state.streamName, function (err, data) {
			var msg;
			if (msg = Q.firstErrorMessage(err, data && data.errors)) {
				alert(msg);
			}
			if (!data) return;
			state.stream = this;

			var i, userId, access;
			prepareSelect(levelForEveryone, {ofUserId: ''}, state.stream.fields[fieldName], 'stream');

			for (i=0; i<state.accessArray.length; ++i) {
				access = state.accessArray[i];
				addAccessRow(access);
			}

			tool.child('Streams_userChooser').onChoose = function (userId, avatar) {
				var fields = {
					publisherId: state.stream.fields.publisherId,
					streamName: state.stream.fields.name,
					ofUserId: userId,
				};
				fields[fieldName] = levelForEveryone.val();

				Q.req('Streams/access', ['data'], function (err, response) {
					var msg;
					if (msg = Q.firstErrorMessage(err, response && response.errors)) {
						alert(msg);
					}
					addAccessRow(response.slots.data.access.fields, avatar);
				}, {
					method: 'put',
					fields: fields
				});
				
			};

			$('.Streams_access_levelAddLabel', element).change(function () {
				var fields = {
					publisherId: state.stream.fields.publisherId,
					streamName: state.stream.fields.name,
					ofContactLabel: $(this).val(),
					'Q.method': 'put'
				};
				fields[fieldName] = levelForEveryone.val();

				Q.req('Streams/access', ['data'], function (err, response) {
					var msg;
					if (msg = Q.firstErrorMessage(err, response && response.errors)) {
						alert(msg);
					}
					addAccessRow(response.slots.data.access.fields);
					state.stream.refresh();
				}, {
					method: 'put',
					fields: fields
				});
			});
		});
	}

	this.Q.onInit.set(function () {
		_initialize();
		onActivateHandler = this.child('Q_tabs').state.onActivate.set(_initialize, this);
	}, this);
});
})(Q, Q.jQuery);