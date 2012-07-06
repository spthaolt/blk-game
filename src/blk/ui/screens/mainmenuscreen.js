/**
 * Copyright 2012 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @author benvanik@google.com (Ben Vanik)
 */

goog.provide('blk.ui.screens.MainMenuScreen');

goog.require('blk.ui.PopupScreen');
goog.require('blk.ui.screens.mainmenuscreen');



/**
 * Main menu.
 * @constructor
 * @extends {blk.ui.PopupScreen}
 * @param {!goog.dom.DomHelper} domHelper DOM helper used to create DOM nodes.
 * @param {!Element} parentElement Parent DOM element to render into.
 */
blk.ui.screens.MainMenuScreen = function(dom, parentElement) {
  goog.base(this, dom, parentElement, blk.ui.screens.mainmenuscreen.content, {
  });
};
goog.inherits(blk.ui.screens.MainMenuScreen, blk.ui.PopupScreen);
