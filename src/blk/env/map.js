/**
 * Copyright 2012 Google, Inc. All Rights Reserved.
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

goog.provide('blk.env.Map');

goog.require('blk.env.BlockSet');
goog.require('blk.env.Chunk');
goog.require('blk.env.ChunkCache');
goog.require('blk.env.Environment');
goog.require('blk.env.blocks.BlueClothBlock');
goog.require('blk.env.blocks.BrickBlock');
goog.require('blk.env.blocks.DirtBlock');
goog.require('blk.env.blocks.GlassBlock');
goog.require('blk.env.blocks.GreenClothBlock');
goog.require('blk.env.blocks.RedClothBlock');
goog.require('blk.env.blocks.StoneBlock');
goog.require('blk.env.blocks.WoodBlock');
goog.require('blk.env.blocks.YellowClothBlock');
goog.require('gf.log');
goog.require('goog.Disposable');
goog.require('goog.array');
goog.require('goog.asserts');



/**
 * Game map, containing all game elements.
 *
 * @constructor
 * @extends {goog.Disposable}
 */
blk.env.Map = function() {
  goog.base(this);

  /**
   * Block set.
   * @type {!blk.env.BlockSet}
   */
  this.blockSet = new blk.env.BlockSet();
  this.blockSet.registerBlock(new blk.env.blocks.DirtBlock());
  this.blockSet.registerBlock(new blk.env.blocks.StoneBlock());
  this.blockSet.registerBlock(new blk.env.blocks.BrickBlock());
  this.blockSet.registerBlock(new blk.env.blocks.WoodBlock());
  this.blockSet.registerBlock(new blk.env.blocks.GlassBlock());
  this.blockSet.registerBlock(new blk.env.blocks.RedClothBlock());
  this.blockSet.registerBlock(new blk.env.blocks.GreenClothBlock());
  this.blockSet.registerBlock(new blk.env.blocks.YellowClothBlock());
  this.blockSet.registerBlock(new blk.env.blocks.BlueClothBlock());

  /**
   * Environment.
   * @type {!blk.env.Environment}
   */
  this.environment = new blk.env.Environment();
  this.registerDisposable(this.environment);

  /**
   * List of active views into the map.
   * @protected
   * @type {!Array.<!blk.env.ChunkView>}
   */
  this.activeViews = [];

  /**
   * Chunk cache.
   * @private
   * @type {!blk.env.ChunkCache}
   */
  this.chunkCache_ = new blk.env.ChunkCache();
  this.registerDisposable(this.chunkCache_);
};
goog.inherits(blk.env.Map, goog.Disposable);


/**
 * @override
 */
blk.env.Map.prototype.disposeInternal = function() {
  goog.asserts.assert(!this.activeViews.length);

  goog.base(this, 'disposeInternal');
};


/**
 * Get a statistics string to display.
 * @return {string} A string to display on the screen.
 */
blk.env.Map.prototype.getStatisticsString = function() {
  var str = 'Chunks: ';
  str += this.chunkCache_.getTotalCount() + ' cached (';
  str += Math.floor(this.chunkCache_.getSize() / 1000) + 'K), ';
  str += this.chunkCache_.getUsedCount() + ' used';
  return str;
};


/**
 * Registers a new chunk view.
 * @param {!blk.env.ChunkView} view Chunk view.
 */
blk.env.Map.prototype.addChunkView = function(view) {
  this.activeViews.push(view);
};


/**
 * Unregisters a chunk view.
 * @param {!blk.env.ChunkView} view Chunk view.
 */
blk.env.Map.prototype.removeChunkView = function(view) {
  goog.array.remove(this.activeViews, view);
};


/**
 * Updates the game map and all contents.
 * @param {!gf.UpdateFrame} frame Current update frame.
 */
blk.env.Map.prototype.update = function(frame) {
  // Handle environment first, in case it changes things
  this.environment.update(frame);

  // Handle chunk cache
  this.chunkCache_.update(frame);
};


/**
 * Gets a chunk from the cache.
 * The returned chunk may not yet be loaded.
 * @param {number} x Chunk X, in world coordinates.
 * @param {number} y Chunk Y, in world coordinates.
 * @param {number} z Chunk Z, in world coordinates.
 * @return {!blk.env.Chunk} Chunk with the given chunk coordinates.
 */
blk.env.Map.prototype.getChunk = function(x, y, z) {
  // Attempt to get
  var chunk = this.chunkCache_.get(x, y, z);
  if (chunk) {
    return chunk;
  }

  // Missing - create and request
  chunk = new blk.env.Chunk(
      this,
      x & ~blk.env.Chunk.MASK_XZ,
      y & ~blk.env.Chunk.MASK_Y,
      z & ~blk.env.Chunk.MASK_XZ);
  this.chunkCache_.add(chunk);
  this.requestChunk(chunk);
  return chunk;
};


/**
 * Notifies all views that a chunk has completed loading.
 * TODO(benvanik): it would be much more efficient to track parent views on
 *                 each chunk and call up
 * @param {!blk.env.Chunk} chunk Chunk.
 */
blk.env.Map.prototype.notifyChunkLoaded = function(chunk) {
  for (var n = 0; n < this.activeViews.length; n++) {
    var view = this.activeViews[n];
    if (view.containsChunk(chunk)) {
      view.notifyChunkLoaded(chunk);
    }
  }
};


/**
 * Adds a chunk to the dirty list.
 * This must only be called when the chunk is newly dirtied.
 * @param {!blk.env.Chunk} chunk Newly dirtied chunk.
 */
blk.env.Map.prototype.addDirtyChunk = goog.nullFunction;


/**
 * Adds a chunk to the unused list.
 * This must only be called when the chunk is newly unused.
 * @param {!blk.env.Chunk} chunk Newly unused chunk.
 */
blk.env.Map.prototype.markChunkUnused = function(chunk) {
  this.chunkCache_.markChunkUnused(chunk);
};


/**
 * Removes a chunk from the unused list.
 * This must only be called when the chunk is newly used.
 * @param {!blk.env.Chunk} chunk Newly used chunk.
 */
blk.env.Map.prototype.markChunkUsed = function(chunk) {
  this.chunkCache_.markChunkUsed(chunk);
};


/**
 * Requests that the given chunk be provided (loaded/generated/etc).
 * @protected
 * @param {!blk.env.Chunk} chunk Chunk to request.
 */
blk.env.Map.prototype.requestChunk = goog.nullFunction;


/**
 * Gets the full 2-byte block data value for the given world coordinates.
 * If the chunk containing the block is not cached, 0 will be returned.
 * This method should only be used rarely. It is designed for cases such as
 * network updates that may or may not fit nicely in any specific view.
 *
 * @param {number} x Block X, in world coordinates.
 * @param {number} y Block Y, in world coordinates.
 * @param {number} z Block Z, in world coordinates.
 * @return {number} Raw 2-byte block data.
 */
blk.env.Map.prototype.getBlock = function(x, y, z) {
  var chunk = this.chunkCache_.get(x, y, z);
  return chunk ? chunk.getBlock(x, y, z) : 0;
};


/**
 * Sets the full 2-byte block data value for the given world coordinates.
 * If the chunk containing the block is not cached, false will be returned.
 * This method should only be used rarely. It is designed for cases such as
 * network updates that may or may not fit nicely in any specific view.
 *
 * @param {number} x Block X, in world coordinates.
 * @param {number} y Block Y, in world coordinates.
 * @param {number} z Block Z, in world coordinates.
 * @param {number} value Raw 2-byte block data.
 * @return {number} Existing raw block data.
 */
blk.env.Map.prototype.setBlock = function(x, y, z, value) {
  var chunk = this.chunkCache_.get(x, y, z);
  if (!chunk) {
    // This is technically a failure, it should be gracefully handled though
    return 0;
  } else if (chunk.state != blk.env.Chunk.State.LOADED) {
    // TODO(benvanik): queue the set for handling when the chunk has been loaded
    //     to ensure consistency (if a setBlock occurs while the client is
    //     waiting for a chunk to download)
    gf.log.write('setBlock before chunk fully loaded - inconsistent state!');
    return 0;
  }

  // Change chunk data
  var oldValue = chunk.setBlock(x, y, z, value);

  // Notify listeners on all viewers
  if (oldValue != value) {
    for (var n = 0; n < this.activeViews.length; n++) {
      this.activeViews[n].notifyBlockChanged(x, y, z);
    }
  }

  return oldValue;
};
