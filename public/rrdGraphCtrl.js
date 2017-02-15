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
 * The rrdGraphCtrl control attaches to a collection of rrdGraphPng widgets and lets
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
                "12 Months":        { order: 14, len: 365*24*3600}
            },
            initialTimeRange: 'Today',
            rangeMatchPrecision: 0.05,
            showTimeBox: true,
            showDateBox: true,
            showTimeRanges: 'dropdown', // 'buttons'
            resetTimeOnDateChange: false,
            switchToCustomOnStartChange: true,
            momentTz: null
        },
        rrdGraphCtrl: function(rrdGraphPngs,cfg){
            var ctrl = new rrdGraphCtrl(this);
            if (rrdGraphPngs instanceof Array){
                ctrl.init(rrdGraphPngs,cfg);
            }
            else {
                ctrl.init([rrdGraphPngs],cfg);
            }
            return ctrl;
        }
    },

    construct : function(selector, context) {
        this.base(arguments, selector, context);
    },

    members : {
        init: function(rrdGraphPngs,cfg){
            if (!this.base(arguments)) {
                return false;
            };
            if (cfg){
                for (var key in cfg){
                    this.setConfig(key,cfg[key])
                }
            }
            this.setProperty('rrdGraphPngs',rrdGraphPngs);
            this.__addDatePicker();
            this.__addRangePicker(); 

            /* sync charts */
            var syncing = false;
            var onChangeStartRange = function(e){
                if (syncing){
                    return;
                }
                syncing = true;
                var start = e.start;
                var range = e.range;
                rrdGraphPngs.forEach(function(png){ 
                    png.setStartRange(start,range);
                },this);
                syncing = false;

            };
            rrdGraphPngs.forEach(function(png){ png.on('changeStartRange',onChangeStartRange,this)},this);           

            return true;
        },
        rebind: function(rrdGraphPngs){
            this.setProperty('rrdGraphPngs',rrdGraphPngs);
            this.emit('rebindrrdGraphPng');
            var that = this;
            rrdGraphPngs.forEach(function(png){png.setStartRange(this.getProperty('start'),this.getProperty('range'))},this);
        },
        __addDatePicker: function(){
            var rrdGraphPngs = this.getProperty('rrdGraphPngs');
            var start = qxWeb.create('<input  type="text"/>');
            start.appendTo(this);
            var picker = start.datepicker().setConfig('format', function(date) {
                return date.toDateString();
            });
            var calendar = picker.getCalendar();
            calendar.setValue(new Date());
            if (! this.getConfig('showDateBox')) {
                start.hide();
            }
            var timeBox = qxWeb.create('<input class="qx-datepicker" size="10" type="text" value="00:00:00" />');
            if (! this.getConfig('showTimeBox')){
                timeBox.hide();
            }
            timeBox.appendTo(this);
            var propagateDateTime = function(){
                var time = timeBox.getValue().split(':');
                [0,1,2].forEach(function(i){
                    time[i] = parseInt(time[i]);
                    if (isNaN(time[i])){
                        time[i] = 0;
                    }
                });
                timeBox.setValue([0,1,2].map(function(i){return ('0'+time[i]).slice(-2)}).join(':'));
                var start;
                var momentTz = this.getConfig('momentTz');
                if (momentTz){
                    start = parseInt(moment.tz(moment(calendar.getValue()).format("YYYY-MM-DD"),momentTz).format('X'));
                }
                else {
                    start = calendar.getValue().getTime()/1000
                }
                start += time[0]*3600+time[1]*60+time[2];
                rrdGraphPngs.forEach(function(png){png.setStart(start)},this);
                this.setProperty('start',start);
                this.emit('syncRrdGraphCtrlRange',start);
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
                propagateDateTime.call(this);
            };
            calendar.on('changeValue',onChangeValueCal,this);

            var blockTime = false;
            timeBox.on('change',propagateDateTime,this);
            var onKeyPressTbox = function(e){
                if (e.key == "Enter") {
                    propagateDateTime();
                }
            };
            timeBox.on('keypress',onKeyPressTbox,this);

            var lastDate;
            var onChangeStartRange = function(e){
                var start = e.start;
                var range = e.range;
                if (isNaN(start)) return;
                var momentTz = this.getConfig('momentTz');
                var date;

                if (momentTz){
                    date = new Date(moment.tz(start * 1000,momentTz).format("YYYY/MM/DD HH:mm:ss"));
                }
                else {
                    date = new Date(start * 1000);
                }
                if (date != lastDate){
                    blockDate = true;
                    calendar.setValue(new Date(date.getTime()));
                    var newTime = date.getHours()+':'+('0'+date.getMinutes()).slice(-2)+':'+('0'+date.getSeconds()).slice(-2);
                    timeBox.setValue(newTime);
                    lastDate = date;
                }
                this.setProperty('start',start);
            };
            rrdGraphPngs.forEach(function(png){ png.on('changeStartRange',onChangeStartRange,this) },this);

            var onRebindrrdGraphPngs = function(){
                rrdGraphPngs.forEach(function(png){ png.off('changeStartRange',onChangeStartRange,this) },this);
                rrdGraphPngs = this.getProperty('rrdGraphPngs');
                rrdGraphPngs.forEach(function(png){ png.on('changeStartRange',onChangeStartRange,this) },this);
            };
            this.on('rebindrrdGraphPng',onRebindrrdGraphPngs,this);

            this.once('qxRrdDispose',function(){
                var that = this;
                this.off('rebindrrdGraphPng',onRebindrrdGraphPngs,this);
                rrdGraphPngs.forEach(function(png){ png.off('changeStartRange',onChangeStartRange,this) },this);
                timeBox.off('change',propagateDateTime,this);
                timeBox.off('keypress',onKeyPressTbox,this);
                timeBox.remove();
                calendar.off('changeValue',onChangeValueCal,this);
                picker.dispose();
                picker.remove();
            },this);
        },
        __getRangeMoment: function(item){
            var l = item.len;
            var end = moment().tz(this.getConfig('momentTz'));
            if (item.end) {
                end.endOf(item.end).add(1,'second');
            }
            var start = end.clone().subtract(item.len,item.end ? item.end : 'second');
            return {
              end: end.unix(),
              range: end.unix() - start.unix()
            };
        },
        __getRange: function(item){
            if (this.getConfig('momentTz')){
              return this.__getRangeMoment(item)
            }
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

        __addRangePicker: function(){
            var rrdGraphPngs = this.getProperty('rrdGraphPngs');

            var rangeSelector = qxWeb.create('<select class="qx-widget qx-selectbox"/>');
            this.setProperty('rangeSelector',rangeSelector);
            rangeSelector.appendTo(this);
            if (this.getConfig('showTimeRanges') == 'buttons'){
                rangeSelector.hide();
            }
            var keys = [];
            var tr =  this.getConfig('timeRanges');
            for (var prop in tr){
                keys.push(prop);
            }
            var that = this;
            keys.sort(function(a,b){ return tr[a].order - tr[b].order })
            .forEach(function(x){
                rangeSelector.append(
                    qxWeb.create('<option/>')
                    .setProperties({
                        value: x,
                        text: x
                    })
                );

                if (that.getConfig('showTimeRanges') == 'buttons'){
                    rangeSelector.hide();
                    var button = qxWeb.create('<button>'+x+'</button>');
                    button.on('tap',function(){
                        rangeSelector.setValue(x);
                        onRangeSelectorChange.call(this);
                    },that);
                    button.appendTo(that);
                }

            });
            var custom = qxWeb.create('<option value="0">Custom</option>');
            rangeSelector.append(custom);
            var blockStart = false;
            var onRangeSelectorChange = function(e){
                var item = tr[rangeSelector.getValue()];
                if (item){
                    if (item.end){
                        var info = this.__getRange(item);
                        if (info){
                            var range = info.range;
                            var start = info.end - range;
                            this.setProperty('range',range);
                            rrdGraphPngs.forEach(function(png){ 
                                png.setStartRange(start,range);
                            },this);
                            
                        }
                        else {
                            console.log("unknown end type "+item.end);
                            return;
                        }
                    }
                    else {
                        rrdGraphPngs.forEach(function(png){  png.setRange(item.len) });
                        this.setProperty('range',item.len);
                    }
                }
            };
            rangeSelector.setValue(this.getConfig('initialTimeRange'));
            rangeSelector.on('change',onRangeSelectorChange,this);

            onRangeSelectorChange.call(this);

            var precision = this.getConfig('rangeMatchPrecision');
            var that = this;
            var onChangeStartRange = function(e){
                var start = e.start;
                var range = e.range;
                if (range == null) return;
                this.setProperty('range',range);
                for (var key in tr){
                    var item = tr[key];
                    if (item.end){
                        var info = this.__getRange(item);
                        if (info){
                            var newRange = info.range;
                            var newStart = info.end - range;
                            if (Math.abs(newRange - range) / range <= precision
                                && Math.abs(newStart - start) / range <= precision ) {
                                rangeSelector.setValue(key);
                                return;
                            }
                        }
                        else {
                            console.log("unknown end type "+item.end);
                            break;
                        }
                    }
                    else {
                        var newRange = item.len;
                        if (Math.abs(newRange - range) / range < 0.05){
                            rangeSelector.setValue(key);
                            return;
                        }
                    }
                }
                rangeSelector.setValue("0");
            };

            var onSyncRange = function(start){
                onChangeStartRange.call(this,{start:start,range:this.getProperty('range')});
            };

            this.on('syncRrdGraphCtrlRange',onSyncRange,this);


            rrdGraphPngs.forEach(function(png){png.on('changeStartRange',onChangeStartRange,this)},this);

            var onRebindrrdGraphPngs =  function(){
                rrdGraphPngs.forEach(function(png){ png.off('changeStartRange',onChangeStartRange,this)},this);
                rrdGraphPngs = this.getProperty('rrdGraphPngs');
                rrdGraphPngs.forEach(function(png){ png.on('changeStartRange',onChangeStartRange,this)},this);
                rrdGraphPngs.forEach(function(png){ png.setRange(this.getProperty('range')) },this);
            };
            this.on('rebindrrdGraphPng',onRebindrrdGraphPngs,this);

            this.once('qxRrdDispose',function(){
                var that = this;
                this.off('rebindrrdGraphPng',onRebindrrdGraphPngs,this);
                this.off('syncRrdGraphCtrlRange',onSyncRange,this);
                rangeSelector.off('change',onRangeChange,this);
                rrdGraphPngs.forEach(function(png){ png.off('changeStartRange',onChangeStartRange,this)},this);
                rangeSelector.remove();
            },this);
        },
        dispose: function(){
            this.emit('qxRrdDispose');
            return this.base(arguments);
        }
    },

    defer : function(statics) {
        qxWeb.$attach({rrdGraphCtrl : statics.rrdGraphCtrl});
    },

});
