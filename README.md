rrdgraph.js
===========

The purpose of rrdgraph.js is to draw rrdtool style chars in the browser,
adding interactive features like zooming and scrolling as well as the
ability to combine data from multiple sources in a single chart.

The data for the chart is loaded via a callback function. You can use the callback
to hook the charts up to your rrdtool server, at the moment for now, you would probably use rrdxport extract the and massage the data
prior to sending it to the frontend.

The javascript would look something like this:

````javascript
var chart = RRDgraph({
    fetchCallback: function([keys],start,end, step){
        return { key: { start: unixTime, step: seconds, data: [1,2,3,4] }, key: ... }
    },
    start: new Date(),
    end: new Date(),
    title: 'Test Chart',
    verticalLabel: 'string',
    upperLimit: x,
    lowerLimit: y,
})
.LINE({
    width: 1,
    color: '#f00',
    label: 'Peter',
    key: 'a' // the key is is the input provided
})
.AREA({
    color: '#f0f',
    label: 'Marc',
    key: 'b'
})
.AREA({
    color: '#ff0',
    label: 'Carl',
    key: 'c',
    stack: true
})
.VDEF('vdfKey1',{
    source: 'a',
    op: 'AVERAGE'
})
.LINE({
    width: 1,
    color: 'rgba(12,22,209,0.3)'
    vdefKey: 'vdefKey1'
})
.HRULE({
    color: 'rgba(12,22,209,0.3)'
    vdefKey: 'vdefKey1'
    label: ''    
})
.GPRINT({
    vdefKey: 'vdefKeyA'
    type: 'sprintf', // or 'strftime',
    format: '%lf'
})
.renderOn('mygraph');
````

and in the dom there should be a div with the appropriate id.

````html
<div id="mygraph">
</div>
````


