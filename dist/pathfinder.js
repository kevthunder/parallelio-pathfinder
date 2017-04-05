(function() {
  var Element, PathFinder, ref1,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Element = ((ref1 = this.Spark) != null ? ref1.Element : void 0) || require('spark-starter');

  PathFinder = (function(superClass) {
    extend(PathFinder, superClass);

    function PathFinder(tilesContainer, from1, to1, options) {
      this.tilesContainer = tilesContainer;
      this.from = from1;
      this.to = to1;
      if (options == null) {
        options = {};
      }
      this.reset();
      if (options.validTile != null) {
        this.validTileCallback = options.validTile;
      }
    }

    PathFinder.properties({
      validTileCallback: {}
    });

    PathFinder.prototype.reset = function() {
      this.queue = [];
      this.paths = {};
      this.solution = null;
      return this.started = false;
    };

    PathFinder.prototype.calcul = function() {
      while (!this.solution && (!this.started || this.queue.length)) {
        this.step();
      }
      return this.getPath();
    };

    PathFinder.prototype.step = function() {
      var next;
      if (this.queue.length) {
        next = this.queue.pop();
        this.addNextSteps(next);
        return true;
      } else if (!this.started) {
        this.started = true;
        this.addNextSteps();
        return true;
      }
    };

    PathFinder.prototype.getPath = function() {
      var res, step;
      if (this.solution) {
        res = [this.solution];
        step = this.solution;
        while (step.prev != null) {
          res.unshift(step.prev);
          step = step.prev;
        }
        return res;
      }
    };

    PathFinder.prototype.getPosAtTime = function(time) {
      var prc, step;
      if (this.solution) {
        if (time >= this.solution.getTotalLength()) {
          return this.solution.posToTileOffset(this.solution.getExit().x, this.solution.getExit().y);
        } else {
          step = this.solution;
          while (step.getStartLength() > time && (step.prev != null)) {
            step = step.prev;
          }
          prc = (time - step.getStartLength()) / step.getLength();
          return step.posToTileOffset(step.getEntry().x + (step.getExit().x - step.getEntry().x) * prc, step.getEntry().y + (step.getExit().y - step.getEntry().y) * prc);
        }
      }
    };

    PathFinder.prototype.tileIsValid = function(tile) {
      if (this.validTileCallback != null) {
        return this.validTileCallback(tile);
      } else {
        return !tile.emulated || (tile.tile !== 0 && tile.tile !== false);
      }
    };

    PathFinder.prototype.getTile = function(x, y) {
      var ref2;
      if (this.tilesContainer.getTile != null) {
        return this.tilesContainer.getTile(x, y);
      } else if (((ref2 = this.tilesContainer[y]) != null ? ref2[x] : void 0) != null) {
        return {
          x: x,
          y: y,
          tile: this.tilesContainer[y][x],
          emulated: true
        };
      }
    };

    PathFinder.prototype.getConnectedToTile = function(tile) {
      var connected, t;
      if (tile.getConnected != null) {
        return tile.getConnected();
      } else {
        connected = [];
        if (t = this.getTile(tile.x + 1, tile.y)) {
          connected.push(t);
        }
        if (t = this.getTile(tile.x - 1, tile.y)) {
          connected.push(t);
        }
        if (t = this.getTile(tile.x, tile.y + 1)) {
          connected.push(t);
        }
        if (t = this.getTile(tile.x, tile.y - 1)) {
          connected.push(t);
        }
        return connected;
      }
    };

    PathFinder.prototype.addNextSteps = function(step) {
      var i, len, next, ref2, results, tile;
      if (step == null) {
        step = null;
      }
      tile = step != null ? step.nextTile : this.from;
      ref2 = this.getConnectedToTile(tile);
      results = [];
      for (i = 0, len = ref2.length; i < len; i++) {
        next = ref2[i];
        if (this.tileIsValid(next)) {
          results.push(this.addStep(new PathFinder.Step(this, (step != null ? step : null), tile, next)));
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    PathFinder.prototype.tileEqual = function(tileA, tileB) {
      return tileA === tileB || ((tileA.emulated || tileB.emulated) && tileA.x === tileB.x && tileA.y === tileB.y);
    };

    PathFinder.prototype.addStep = function(step) {
      if (this.paths[step.getExit().x] == null) {
        this.paths[step.getExit().x] = {};
      }
      if (!((this.paths[step.getExit().x][step.getExit().y] != null) && this.paths[step.getExit().x][step.getExit().y].getTotalLength() <= step.getTotalLength())) {
        if (this.paths[step.getExit().x][step.getExit().y] != null) {
          this.removeStep(this.paths[step.getExit().x][step.getExit().y]);
        }
        this.paths[step.getExit().x][step.getExit().y] = step;
        this.queue.splice(this.getStepRank(step), 0, step);
        if (this.tileEqual(step.nextTile, this.to) && !((this.solution != null) && this.solution.prev.getTotalLength() <= step.getTotalLength())) {
          return this.solution = new PathFinder.Step(this, step, step.nextTile, null);
        }
      }
    };

    PathFinder.prototype.removeStep = function(step) {
      var index;
      index = this.queue.indexOf(step);
      if (index > -1) {
        return this.queue.splice(index, 1);
      }
    };

    PathFinder.prototype.best = function() {
      return this.queue[this.queue.length - 1];
    };

    PathFinder.prototype.getStepRank = function(step) {
      if (this.queue.length === 0) {
        return 0;
      } else {
        return this._getStepRank(step.getEfficiency(), 0, this.queue.length - 1);
      }
    };

    PathFinder.prototype._getStepRank = function(efficiency, min, max) {
      var ref, refPos;
      refPos = Math.floor((max - min) / 2) + min;
      ref = this.queue[refPos].getEfficiency();
      if (ref === efficiency) {
        return refPos;
      } else if (ref > efficiency) {
        if (refPos === min) {
          return min;
        } else {
          return this._getStepRank(efficiency, min, refPos - 1);
        }
      } else {
        if (refPos === max) {
          return max + 1;
        } else {
          return this._getStepRank(efficiency, refPos + 1, max);
        }
      }
    };

    return PathFinder;

  })(Element);

  PathFinder.Step = (function() {
    function Step(pathFinder, prev, tile1, nextTile) {
      this.pathFinder = pathFinder;
      this.prev = prev;
      this.tile = tile1;
      this.nextTile = nextTile;
    }

    Step.prototype.posToTileOffset = function(x, y) {
      var tile;
      tile = Math.floor(x) === this.tile.x && Math.floor(y) === this.tile.y ? this.tile : Math.floor(x) === this.nextTile.x && Math.floor(y) === this.nextTile.y ? this.nextTile : (this.prev != null) && Math.floor(x) === this.prev.tile.x && Math.floor(y) === this.prev.tile.y ? this.prev.tile : console.log('Math.floor(' + x + ') == ' + this.tile.x, 'Math.floor(' + y + ') == ' + this.tile.y, this);
      return {
        x: x,
        y: y,
        tile: tile,
        offsetX: x - tile.x,
        offsetY: y - tile.y
      };
    };

    Step.prototype.getExit = function() {
      if (this.exit == null) {
        if (this.nextTile != null) {
          this.exit = {
            x: (this.tile.x + this.nextTile.x + 1) / 2,
            y: (this.tile.y + this.nextTile.y + 1) / 2
          };
        } else {
          this.exit = {
            x: this.tile.x + 0.5,
            y: this.tile.y + 0.5
          };
        }
      }
      return this.exit;
    };

    Step.prototype.getEntry = function() {
      if (this.entry == null) {
        if (this.prev != null) {
          this.entry = {
            x: (this.tile.x + this.prev.tile.x + 1) / 2,
            y: (this.tile.y + this.prev.tile.y + 1) / 2
          };
        } else {
          this.entry = {
            x: this.tile.x + 0.5,
            y: this.tile.y + 0.5
          };
        }
      }
      return this.entry;
    };

    Step.prototype.getLength = function() {
      if (this.length == null) {
        this.length = (this.nextTile == null) || (this.prev == null) ? 0.5 : this.prev.tile.x === this.nextTile.x || this.prev.tile.y === this.nextTile.y ? 1 : Math.sqrt(0.5);
      }
      return this.length;
    };

    Step.prototype.getStartLength = function() {
      if (this.startLength == null) {
        this.startLength = this.prev != null ? this.prev.getTotalLength() : 0;
      }
      return this.startLength;
    };

    Step.prototype.getTotalLength = function() {
      if (this.totalLength == null) {
        this.totalLength = this.getStartLength() + this.getLength();
      }
      return this.totalLength;
    };

    Step.prototype.getEfficiency = function() {
      if (this.efficiency == null) {
        this.efficiency = -this.getRemaining() * 1.1 - this.getTotalLength();
      }
      return this.efficiency;
    };

    Step.prototype.getRemaining = function() {
      var from, to, x, y;
      if (this.remaining == null) {
        from = this.getExit();
        to = {
          x: this.pathFinder.to.x + 0.5,
          y: this.pathFinder.to.y + 0.5
        };
        x = to.x - from.x;
        y = to.y - from.y;
        this.remaining = Math.sqrt(x * x + y * y);
      }
      return this.remaining;
    };

    return Step;

  })();

  if (typeof module !== "undefined" && module !== null) {
    module.exports = PathFinder;
  } else {
    if (this.Parallelio == null) {
      this.Parallelio = {};
    }
    this.Parallelio.PathFinder = PathFinder;
  }

}).call(this);
