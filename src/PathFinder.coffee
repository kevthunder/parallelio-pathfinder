Element = require('spark-starter').Element

class PathFinder extends Element
  constructor: (@tilesContainer, @from, @to, options={}) ->
    @reset()
    if options.validTile?
      @validTileCallback = options.validTile
  @properties
    validTileCallback: {}
  reset: ->
    @queue = []
    @paths = {}
    @solution = null
    @started = false
  calcul: ->
    while !@solution and (!@started or @queue.length)
      @step()
    @getPath()
  step: ->
    if @queue.length
      next = @queue.pop()
      @addNextSteps(next)
      true
    else if !@started
      @started = true
      @addNextSteps()
      true
  getPath: ->
    if @solution
      res = [@solution]
      step = @solution
      while step.prev?
        res.unshift(step.prev)
        step = step.prev
      res
  getPosAtPrc: (prc) ->
    if isNaN(prc)
      throw new Error('Invalid number')
    if @solution
      @getPosAtTime(@solution.getTotalLength()*prc)
  getPosAtTime: (time) ->
    if @solution
      if time >= @solution.getTotalLength()
        @solution.posToTileOffset(
          @solution.getExit().x
          @solution.getExit().y
        )
      else
        step = @solution
        while step.getStartLength() > time and step.prev?
          step = step.prev
        prc = (time - step.getStartLength()) / step.getLength()
        step.posToTileOffset(
          step.getEntry().x + (step.getExit().x-step.getEntry().x) * prc
          step.getEntry().y + (step.getExit().y-step.getEntry().y) * prc
        )
  tileIsValid: (tile) ->
    if @validTileCallback?
      @validTileCallback(tile)
    else
      !tile.emulated or (tile.tile != 0 and tile.tile != false)
  getTile: (x, y) ->
    if @tilesContainer.getTile?
      @tilesContainer.getTile(x, y)
    else if @tilesContainer[y]?[x]?
      {
        x: x
        y: y
        tile: @tilesContainer[y][x]
        emulated: true
      }
  getConnectedToTile: (tile) ->
    if tile.getConnected?
      tile.getConnected()
    else
      connected = []
      if t = @getTile(tile.x+1, tile.y)
        connected.push(t)
      if t = @getTile(tile.x-1, tile.y)
        connected.push(t)
      if t = @getTile(tile.x, tile.y+1)
        connected.push(t)
      if t = @getTile(tile.x, tile.y-1)
        connected.push(t)
      connected
  addNextSteps: (step = null) ->
    tile = if step? then step.nextTile else @from
    for next in @getConnectedToTile(tile)
      if @tileIsValid(next)
        @addStep(new PathFinder.Step(this, (if step? then step else null), tile, next))
  tileEqual: (tileA, tileB)->
    tileA == tileB or ((tileA.emulated or tileB.emulated) and tileA.x == tileB.x and tileA.y == tileB.y)
  addStep: (step)->
    @paths[step.getExit().x] = {} unless @paths[step.getExit().x]?
    unless @paths[step.getExit().x][step.getExit().y]? and @paths[step.getExit().x][step.getExit().y].getTotalLength() <= step.getTotalLength()
      if @paths[step.getExit().x][step.getExit().y]?
        @removeStep(@paths[step.getExit().x][step.getExit().y])
      @paths[step.getExit().x][step.getExit().y] = step
      @queue.splice(@getStepRank(step), 0, step)
      if @tileEqual(step.nextTile, @to) and !(@solution? and @solution.prev.getTotalLength() <= step.getTotalLength())
        @solution = new PathFinder.Step(this, step, step.nextTile, null)
  removeStep: (step)->
    index = @queue.indexOf(step)
    if index > -1
      @queue.splice(index, 1)
  best:->
    @queue[@queue.length-1]
  getStepRank: (step)->
    if @queue.length == 0
      0
    else
      @_getStepRank(step.getEfficiency(),0,@queue.length-1)
  _getStepRank: (efficiency,min,max)->
    refPos = Math.floor((max-min)/2)+min
    ref = @queue[refPos].getEfficiency()
    if ref == efficiency
      refPos
    else if ref > efficiency
      if refPos == min
        min
      else
        @_getStepRank(efficiency, min, refPos-1)
    else
      if refPos == max
        max + 1
      else
        @_getStepRank(efficiency, refPos+1, max)
        
class PathFinder.Step
  constructor: (@pathFinder, @prev, @tile, @nextTile) ->
    
  posToTileOffset: (x, y)->
    tile = if Math.floor(x) == @tile.x and Math.floor(y) == @tile.y
      @tile
    else if @nextTile? && Math.floor(x) == @nextTile.x and Math.floor(y) == @nextTile.y
      @nextTile
    else if @prev? and  Math.floor(x) == @prev.tile.x and Math.floor(y) == @prev.tile.y
      @prev.tile
    else
      console.log('Math.floor('+x+') == '+@tile.x, 'Math.floor('+y+') == '+@tile.y, this)
    {
      x: x
      y: y
      tile: tile
      offsetX: x - tile.x
      offsetY: y - tile.y
    }
  getExit: ->
    unless @exit?
      if @nextTile?
        @exit = 
          x: (@tile.x + @nextTile.x + 1)/2
          y: (@tile.y + @nextTile.y + 1)/2
      else
        @exit = 
          x: @tile.x + 0.5
          y: @tile.y + 0.5
    @exit
  getEntry: ->
    unless @entry?
      if @prev?
        @entry = 
          x: (@tile.x + @prev.tile.x + 1)/2
          y: (@tile.y + @prev.tile.y + 1)/2
      else
        @entry = 
          x: @tile.x + 0.5
          y: @tile.y + 0.5
    @entry
  getLength: ->
    unless @length?
      @length = 
        if !@nextTile? or !@prev?
          0.5
        else if @prev.tile.x == @nextTile.x or @prev.tile.y == @nextTile.y
          1
        else
          Math.sqrt( 0.5 )
    @length
  getStartLength: ->
    unless @startLength?
      @startLength = if @prev? then @prev.getTotalLength() else 0
    @startLength
  getTotalLength: ->
    unless @totalLength?
      @totalLength = @getStartLength() + @getLength()
    @totalLength
  getEfficiency: ->
    unless @efficiency?
      @efficiency = - @getRemaining() * 1.1 - @getTotalLength()
    @efficiency
  getRemaining: ->
    unless @remaining?
      from = @getExit()
      to = {x:@pathFinder.to.x + 0.5, y:@pathFinder.to.y + 0.5}
      x = to.x - from.x
      y = to.y - from.y
      @remaining = Math.sqrt( x * x + y * y )
    @remaining
    