RrdGraphJS
==========

The purpose of RrdGraphJS is to allow live interaction with RRD graphs.
There are two approaches to accomplish this.  The simple one, where we just
have the browser request freshly rendered images from the server, according
to the users interactions.  And the more complex one where the images are
drawn at the browser end.

After initial experiments with jQuery, I have switched to [qooxdoo
Website](http://www.qooxdoo.org) as a base library.  It is a bit larger than
jQuery, but the advantage is, that it provides a host of features I would
have had to source from thridparty libraries or write myself otherwhise. 
Notably the event normalization which made the implementation of the chart
interaction much simpler.


rrdGraphPng.js
--------------
RrdGraphPng.js kicks your RRD graphs into life by requesting new bitmaps from the server as
you interact with the chart in the browser.  The only thing required on the
server side to make this work, is the ability to specify a start and end
time for the chart you are requesting from the server.

Depending on the number of people playing with your charts, the load on the
server can be significant as it will have to draw several graphs a second as
the user interacts with the graphs.

### Instantiation

```JavaScript
var g = q(selector).rrdGraphPng(configMap);
```

The selector is expected to pick up `<img>` tags with a `data-src-template` attribute. The template can contain the following mustache tags:

```HTML
<img class="rrd"  data-src-template="graphA?start={{start}}&amp;end={{end}}" />
```

#### `{{start}}`, `{{end}}`

the start and end time of the chart in epoch seconds.

#### `{{width}}`, `{{height}}`

The size of you image tag as input for the back end chart renderer (make sure to provide img sizing instructions via css).

#### `{{random}}`

A random number for every chart requested. Use this to make sure to get a current image if you run into trouble with an eager cache.

#### `{{zoom}}`

If you set the `moveZoom` property. It will show up here while the chart is being moved. Causing a lower resolution (faster) chart
to be rendered during animation operations.

### Configuration Properties

#### `canvasPadding`

For zooming the pointer position on the graph canvas is relevant. Since the JS can not see where the actual chart
is on the png image, this option allows you to provide a hint. Default: `100`

#### `initialStart`

Epoch time for the start of the chart as it is initially loaded. Default: `(new Date()).getTime() / 1000 - 24*3600`

#### `initialRange`

Initial time range for the chart in seconds. Default: `24*3600`

#### `moveZoom`

The `moveZoom` value  will show up in `{{zoom}}` while the chart is being moved. Causing a lower resolution (faster) chart
to be rendered during animation operations.

### Methods

#### `g.setStart(start)`, `g.setRange(range)`, `g.setStartRange(start,range)`

Actively set the time and zoom level for the chart. This will also update the chart.

#### `g.getStart()`, `g.getRange()`

Request the current time and zoom level.

#### `g.update()`

Cause the chart to be updated even when neither start nor range are changed.

#### `g.dispose()`

Remove ourselfs from the img.

### Events

#### `changeRange`, `changeStart`

These two events get emited if the chart if moved or zoomed.

```JavaScript
g.on('changeRange',function(range){
    console.log('new range:' + range);
});
```

rrdGraphCtrl.js
---------------
Is a control panel for explicitly choosing what information the charts should show. It works with two way data binding. As you manipulate the graph with your pointer, the control panel content will change accordingly.


### Instantiation

```JavaScript
var c = q(selector).rrdGraphCtrl(g,configMap);
```

The selector is expected to pick up a `<div>` tag. The control elements get added into the div tag.

```HTML
<div class="ctrl"></div>
```

### Configuration Properties

#### `timeRanges`

A map of pre configured time ranges. See the source for details.

#### `initialTimeRange`

Which time range to select at the start. Default: `Today`.

#### `showTimeBox`

Display the time entry field. Default `true`

#### `resetTimeOnDateChange`

Reset the time to `0:00` when a new date is selected.
Default: `false`

#### `switchToCustomOnStartChange`

Switch the time range selector to `custom` if the graph start time changes. Default `true`

### Methods

#### `c.dispose()`

Remove ourselfs from the img.

rrdGraphSvg.js
--------------
rrdGraphSvg.js implements RRD graphs on the browser side. It, in svg, relying on the wonderful
d3.js library for lowlevel data manipulation.  It requires the output of
xport to get to the actual data. Since very few monitoring systems readily provide xport data access, this variant is more difficult to implement in an existing system.

Also the implementation does not yet cover all the drawing instructions available in rrd_graph. Especially for `VDEF` and `GPRINT` statements there is not even a plan yet on how to implement them.

*`rrdGraphSvg.js` is taken from my extopus project ... it does not yet work in a generic way. It is just included as a place-holder at this point in time.*

Example
-------

```HTML
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <link href="rrdGraphCtrl.css" rel="stylesheet">
    <!-- the modules are implemented on top of the qxWeb library
         from www.qooxdoo.org. It provides excellent
         modularization and event normalization support out of
         the box and thus made implementation of these
         modules much simpler -->
    <script type="text/javascript" src="q-4.1.min.js"></script>
    <script type="text/javascript" src="rrdGraphPng.js"></script>
    <script type="text/javascript" src="rrdGraphCtrl.js"></script>
    <script type="text/javascript">
        q.ready(function(){

            // 'activate' the charts
            var graph = q('.graph').rrdGraphPng({
                canvasPadding: 120
            });

            // crate a control panel and attach it to the charts
            q('#ctrl').rrdGraphCtrl(graph,{
                initialTimeRange: 'Last 60 Minutes',
                resetTimeOnDateChange: true
            });

            // you can also remove all the magic again
            q('#button').on('click',function(){
                q('#ctrl').dispose();
                q('.graph').dispose();
            });
        });
    </script>
</head>
<body>
    <div id="ctrl"></div>

    <div><img
        style="width:695px;height:238px" class="graph"
        data-src-template="graphA?width={{width}}&amp;height={{height}}&amp;start={{start}}&amp;end={{end}}&amp;zoom={{zoom}}&amp;rand={{random}}"
    /></div>

    <div><img
        style="width:695px;height:238px" class="graph"
        data-src-template="graphB?width={{width}}&amp;height={{height}}&amp;start={{start}}&amp;end={{end}}&amp;zoom={{zoom}}&amp;rand={{random}}"
    /></div>

    <button id="remove">Remove it all!</button>
</body>
</html>
```
