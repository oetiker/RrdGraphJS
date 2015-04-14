/* *********************************************************************
   rrdGraphCtrl - control panel for rrdGraphPng charts

   Copyright:
     2015 OETIKER+PARTNER AG http://www.oetiker.ch

   License:
     Gnu GPL Version 2

   Version: #VERSION#, #DATE#

   Authors:
     * Tobias Oetiker (oetiker)

* **********************************************************************/

/**
 * The rrdGraphCtrl control turns attaches to a rrdGraphPng object and lets
 * select start time and range of the graphs.
 */

qxWeb.define('rrdGraphCtrl',{
    extend: qxWeb.$$qx.ui.website.Widget,
    statics: {
        _config : {
            timeRanges: {
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
            initialTimeRange: 'Today',
            showTimeBox: true,
            resetTimeOnDateChange: false,
            switchToCustomOnStartChange: true

        },
        rrdGraphCtrl: function(rrdGraph,cfg){
            var rrdGraphCtrl = new rrdGraphCtrl(this);

            rrdGraphCtrl.init(rrdGraph,cfg);
            return rrdGraphCtrl;
        }
    },

    construct : function(selector, context) {
        this.base(arguments, selector, context);
    },

    members : {
        __start: null,
        __range: null,
        __graph: null,
        init: function(rrdGraph,cfg){
            if (!this.base(arguments)) {
                return false;
            };
            if (cfg){
                for (var key in cfg){
                    this.setConfig(key,cfg[key])
                }
            }
            this.__graph = rrdGraph;
            this._forEachElementWrapped(function(div,idx) {
                this.__addDatePicker(div);
                this.__addRangePicker(div);
            });
            return true;
        },
        __addDatePicker: function(div){
            var rrdGraph = this.__graph;
            var start = qxWeb.create('<input  type="text"/>');
            start.appendTo(div);
            var picker = start.datepicker().setConfig('format', function(date) {
                return date.toDateString();
            });
            var calendar = picker.getCalendar();
            calendar.setValue(new Date());

            var timeBox = qxWeb.create('<input class="qx-datepicker" size="10" type="text" value="00:00:00" />');
            if (! this.getConfig('showTimeBox')){
                timeBox.hide();
            }
            timeBox.appendTo(div);
            var getDateTime = function(){
                var time = timeBox.getValue().split(':');
                [0,1,2].forEach(function(i){
                    time[i] = parseInt(time[i]);
                    if (isNaN(time[i])){
                        time[i] = 0;
                    }
                });
                timeBox.setValue([0,1,2].map(function(i){return ('0'+time[i]).slice(-2)}).join(':'));
                return calendar.getValue().getTime()/1000+time[0]*3600+time[1]*60+time[2];
            };

            var blockDate = false;
            var onChangeValueCal = function(){
                if (blockDate){
                    blockDate = false;
                    return;
                }
                if (this.getConfig('resetTimeOnDateChange')){
                    timeBox.setValue('00:00:00');
                }
                rrdGraph.setStart(getDateTime());
            };
            calendar.on('changeValue',onChangeValueCal,this);

            var blockTime = false;
            var onChangeTBox = function(){rrdGraph.setStart(getDateTime())};
            timeBox.on('change',onChangeTBox,this);
            var onKeyPressTbox = function(e){
                if (e.key == "Enter") {
                    rrdGraph.setStart(getDateTime());
                }
            };
            timeBox.on('keypress',onKeyPressTbox,this);
            var lastDate;
            var onStart = function(value){
                if (isNaN(value)) return;
                var date = new Date(value * 1000);
                if (date != lastDate){
                    blockDate = true;
                    calendar.setValue(new Date(date.getTime()));
                    var newTime = date.getHours()+':'+('0'+date.getMinutes()).slice(-2)+':'+('0'+date.getSeconds()).slice(-2);
                    timeBox.setValue(newTime);
                    lastDate = date;
                }
            };
            rrdGraph.eq(0).on('changeStart',onStart,this);
            div.once('qxRrdDispose',function(){
                rrdGraph.eq(0).off('changeStart',onStart,this);
                timeBox.off('change',onChangeTBox,this);
                timeBox.off('keypress',onKeyPressTbox,this);
                timeBox.remove();
                calendar.off('changeValue',onChangeValueCal,this);
                picker.dispose();
                picker.remove();
            },this);
        },
        __getRange: function(item){
            var d = item.end;
            var l = item.len;
            var now = new Date;
            var start;
            now.setMilliseconds(0);
            now.setSeconds(0);
            if (d == 'minute'){
                now.setMinutes(now.getMinutes()+1)
                start = new Date(now.getTime());
                start.setMinutes(start.getMinutes()-l);
            }
            else {
                now.setMinutes(0);
                if (d == 'hour'){
                    now.setHours(now.getHours()+1)
                    start = new Date(now.getTime());
                    start.setHours(start.getHours()-l);
                }
                else {
                    now.setHours(0);
                    if (d == 'day'){
                        now.setDate(now.getDate()+1)
                        start = new Date(now.getTime());
                        start.setDate(start.getDate()-l);
                    }
                    else {
                        if (d == 'week'){
                            now.setDate(now.getDate()-now.getDay()+8);
                            start = new Date(now.getTime());
                            start.setDate(start.getDate()-l*7);
                        }
                        else {
                            now.setDate(1);
                            if (d == 'month'){
                                now.setMonth(now.getMonth()+1);
                                start = new Date(now.getTime());
                                start.setMonth(start.getMonth()-l);
                            }
                            else {
                                now.setMonth(0);
                                if (d == 'year'){
                                    now.setYear(now.getFullYear()+1);
                                    start = new Date(now.getTime());
                                    start.setYear(start.getFullYear()-l);
                                }
                            }
                        }
                    }
                }
            }
            var end = now.getTime()/1000;
            return {
                range: Math.round(end-start.getTime()/1000),
                end: Math.round(end)
            };
        },
        __addRangePicker: function(div){
            var rrdGraph = this.__graph;
            var rangeEl = qxWeb.create('<select class="qx-widget qx-selectbox"/>');
            rangeEl.appendTo(div);
            var keys = [];
            var tr =  this.getConfig('timeRanges');
            for (var prop in tr){
                keys.push(prop);
            }
            keys.sort(function(a,b){ return tr[a].order - tr[b].order })
            .forEach(function(x){
                rangeEl.append(
                    qxWeb.create('<option/>')
                    .setProperties({
                        value: x,
                        text: x
                    })
                );
            });
            var custom = qxWeb.create('<option value="0">Custom</option>');
            rangeEl.append(custom);
            var blockStart = false;
            var that = this;
            var onRangeChange = function(e){
                var item = tr[rangeEl.getValue()];
                if (item){
                    if (item.end){
                        var info = that.__getRange(item);
                        if (info){
                            var range = info.range;
                            var start = info.end - range;
                            rrdGraph.setStartRange(start,range);
                            blockStart = true;
                            rrdGraph.emit('changeStart',start);
                        }
                        else {
                            console.log("unknown end type "+item.end);
                        }
                    }
                    else {
                        rrdGraph.setStartRange(rrdGraph.getStart(),item.len);
                        blockStart = true;
                        rrdGraph.emit('changeStart',start);
                    }
                }
            };
            rangeEl.setValue(this.getConfig('initialTimeRange'));
            onRangeChange();
            rangeEl.on('change',onRangeChange,this);
            var onChangeStart = function(v){
                    if (!blockStart){
                        rangeEl.setValue("0");
                    }
                    blockStart = false;
            };
            if (this.getConfig('switchToCustomOnStartChange')){
                rrdGraph.eq(0).on('changeStart',onChangeStart,this);
            }
            var onChangeGraphRange = function(v){
                rangeEl.setValue("0");
            };
            rrdGraph.eq(0).on('changeRange',onChangeGraphRange,this);
            div.once('qxRrdDispose',function(){
                rangeEl.off('change',onRangeChange,this);
                rrdGraph.eq(0).off('changeStart',onChangeStart,this);
                rrdGraph.eq(0).off('changeRange',onChangeGraphRange,this);
                rangeEl.remove();
            },this);
        },
        dispose: function(){
            this._forEachElementWrapped(function(ctrl) {
                ctrl.emit('qxRrdDispose');
            },this);
            return this.base(arguments);
        }
    },

    defer : function(statics) {
        qxWeb.$attach({rrdGraphCtrl : statics.rrdGraphCtrl});
    },

});
