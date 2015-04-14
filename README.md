RrdGraphJS
==========

The purpose of RrdGraphJS is to allow live interaction with RRD graphs.
There are two approaches to accomplish this.  The simple one, where we just
have the browser request freshly rendered images from the server, according
to the users interactions.  And the more complex one where the images are
drawn at the browser end.

rrdGraphPng.js
--------------
RrdGraphPng.js kicks your RRD graphs into life by requesting new bitmaps from the server as
you interact with the chart in the browser.  The only thing required on the
server side to make this work, is the ability to specify a start and end
time for the chart you are requesting from the server.

Depending on the number of people playing with your charts, the load on the
server can be significant as it will have to draw several graphs a second as
the user interacts with the graphs.



rrdGraphCtrl.js
---------------
Is a control panel for explicitly choosing what information the charts should show. It works with two way data binding. As you manipulate the graph with your pointer, the control panel content will change accordingly.


rrdGraphSvg.js
--------------
rrdGraphSvg.js implements RRD graphs on the browser side. It, in svg, relying on the wonderful
d3.js library for lowlevel data manipulation.  It requires the output of
xport to get to the actual data. Since very few monitoring systems readily provide xport data access, this variant is more difficult to implement in an existing system.

Also the implementation does not yet cover all the drawing instructions available in rrd_graph. Especially for `VDEF` and `GPRINT` statements there is not even a plan yet on how to implement them.

*`rrdGraphSvg.js` is taken from my extopus project ... it does not yet work in a generic way. It is just included as a place-holder at this point in time.*


Example
-------

For now this is all the documentation there is ...

```HTML
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <link href="rrdGraphCtrl.css" rel="stylesheet">
    <script type="text/javascript" src="q-4.1.min.js"></script>
    <script type="text/javascript" src="rrdGraphPng.js"></script>
    <script type="text/javascript">
        q.ready(function(){

            // 'activate' the charts
            var graph = q('.graph').rrdGraphPng({
                // the following is the default configuration, no need to repeat it
                // in actual use
                canvasPadding: 100,  // how much is the drawing canvas padded with white space
                initialStart : (new Date()).getTime() / 1000 - 24*3600, // start time for in epoch format
                initialRange: 24*3600, // initial time range for the chart
                moveZoom: 1, // zoom factor to use while the chart is moving (reduces load on the server)
                cursorUrl: '.' // location of the .cur files relative to the location of the html file
            });

            // crate a control panel and attach it to the charts
            q('#ctrl').rrdGraphCtrl(graph,{
                // default options
                timeRanges: { // the content of the time range select box
                    "Last 60 Minutes":  { order: 0, len: 60, end: 'minute' },
                    "Last 24 Hours":    { order: 1, len: 24, end: 'hour' },
                    "Last 7 Days":      { order: 2, len: 7,  end: 'day' },
                    "Last 31 Days":     { order: 3, len: 31, end: 'day' },
                    "Last 12 Months":   { order: 4, len: 12, end: 'month' },
                    "Today":            { order: 5, len: 1,  end: 'day' },
                    "This Week":        { order: 6, len: 1,  end: 'week' },
                    "This Month":       { order: 7, len: 1,  end: 'month' },
                    "This Year":        { order: 8, len: 1,  end: 'year' },
                    "60 Minutes":       { order: 9, len: 3600},
                    "12 Hours":         { order: 10, len: 12*3600},
                    "24 Hours":         { order: 11, len: 24*3600},
                    "7 Days":           { order: 12, len: 7*24*3600},
                    "4 Weeks":          { order: 13, len: 4*7*24*3600},
                    "12 Months":        { order: 13, len: 365*24*3600}
                },
                initialTimeRange: 'Today',  // name of the time range to select initially
                hideTimeBox: false, // hide the time entry field
                resetTimeOnDateChange: false, // reset the time to midnight on date-change
                switchToCustomOnStartChange: true // switch time range to 'custom' if chart time is changed
            });
        });
    </script>
</head>
<body>
    <!-- the chart control panel will be inserted here -->
    <div id="ctrl"></div>

    <!-- the img tags are expected to contain a special data-src-template
         property containing the image url, with template tags inserted. The random
         tag is intended to make sure charts do not get cached on the way. This is especially
         important when viewing current data -->

    <div><img
        style="width:695px;height:238px" class="graph"
        data-src-template="graphA?width={{width}}&amp;height={{height}}&amp;start={{start}}&amp;end={{end}}&amp;zoom={{zoom}}&amp;rand={{random}}"
    ></div>

    <div><img
        style="width:695px;height:238px" class="graph"
        data-src-template="graphB?width={{width}}&amp;height={{height}}&amp;start={{start}}&amp;end={{end}}&amp;zoom={{zoom}}&amp;rand={{random}}"
    ></div>

</body>
</html>
```
