rrdgraph.js
===========

The purpose of rrdgraph.js is to draw rrdtool style chars in the browser,
adding interactive features like zooming and scrolling as well as the
ability to combine data from multiple sources in a single chart.

usage:

```html
<div id="rrdgraph">
<script type="text/javascript" charset="utf-8" src="rrdgrah.js"></script>
<script type="text/javascript" charset="utf-8">
    var chart = RRDgraph({
        id: 'rrdgraph',
        data: ['/rrdXport?src=a','/rrdXport?src=b']
    });
</script>
</div>
````


