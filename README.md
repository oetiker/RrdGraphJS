rrdgraph.js
===========

The purpose of rrdgraph.js is to draw rrdtool style chars in the browser,
adding interactive features like zooming and scrolling as well as the
ability to combine data from multiple sources in a single chart.

usage:

```html
<div id="mygraph">
<script type="text/javascript" charset="utf-8" src="rrdgraph.js"></script>
<script type="text/javascript" charset="utf-8">
    var chart = RRDgraph({
        dataCb: function(key,start,end){return { start: x, step: z, data: [1,2,3,4] } },
        start: new Date(),
        end: new Date()
    );
    var line = chart.add('LINE',{
        width: 1,
        color: '#f00',
        label: 'Peter',
        data: 'a'
    });
    var area1 = chart.add('AREA',{
        color: '#f0f',
        label: 'Marc',
        data: 'b'
    });
    var area2 = chart.stack('AREA',{
        color: '#ff0',
        label: 'Carl',
        data: 'c'
    });
    chart.display('mygraph');
</script>
</div>
````


