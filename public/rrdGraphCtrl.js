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
        rrdGraphCtrl: function(rrdGraphPng,cfg){
            var ctrl = new rrdGraphCtrl(this);

            ctrl.init(rrdGraphPng,cfg);
            return ctrl;
        }
    },

    construct : function(selector, context) {
        this.base(arguments, selector, context);
    },

    members : {
        __start: null,
        __range: null,
        __rrdGraphPng: null,
        init: function(rrdGraphPng,cfg){
            if (!this.base(arguments)) {
                return false;
            };
            if (cfg){
                for (var key in cfg){
                    this.setConfig(key,cfg[key])
                }
            }
            this.__rrdGraphPng = rrdGraphPng;
            this._forEachElementWrapped(function(div,idx) {
                this.__addDatePicker(div);
                this.__addRangePicker(div);
            });
            return true;
        },
        rebind: function(rrdGraphPng){
            this.__rrdGraphPng = rrdGraphPng;
            this.emit('rebindRrdGraphPng');
        },
        __addDatePicker: function(div){
            var rrdGraphPng = this.__rrdGraphPng;
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
                rrdGraphPng.setStart(getDateTime());
            };
            calendar.on('changeValue',onChangeValueCal,this);

            var blockTime = false;
            var onChangeTBox = function(){rrdGraphPng.setStart(getDateTime())};
            timeBox.on('change',onChangeTBox,this);
            var onKeyPressTbox = function(e){
                if (e.key == "Enter") {
                    rrdGraphPng.setStart(getDateTime());
                }
            };
            timeBox.on('keypress',onKeyPressTbox,this);
            var lastDate;
            var onChangeStartRange = function(e){
                var start = e.start;
                var range = e.range;
                console.log(start,range);
                if (isNaN(start)) return;
                var date = new Date(start * 1000);
                if (date != lastDate){
                    blockDate = true;
                    calendar.setValue(new Date(date.getTime()));
                    var newTime = date.getHours()+':'+('0'+date.getMinutes()).slice(-2)+':'+('0'+date.getSeconds()).slice(-2);
                    timeBox.setValue(newTime);
                    lastDate = date;
                }
            };
            rrdGraphPng.eq(0).on('changeStartRange',onChangeStartRange,this);

            var onChangeRrdGraphPngBinding = function(){
                rrdGraphPng.eq(0).off('changeStartRange',onChangeStartRange,this);
                rrdGraphPng = this.__rrdGraphPng;
                rrdGraphPng.eq(0).on('changeStartRange',onChangeStartRange,this);
                rrdGraphPng.setStart(getDateTime());

            };
            this.on('changeRrdGraphPngBinding',onChangeRrdGraphPngBinding,this);
     
            div.once('qxRrdDispose',function(){
                this.off('changeRrdGraphPngBinding',onChangeRrdGraphPngBinding,this);
                rrdGraphPng.eq(0).off('changeStartRange',onChangeStartRange,this);
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
            var rrdGraphPng = this.__rrdGraphPng;
            var lastRange;

            var rangeSelector = qxWeb.create('<select class="qx-widget qx-selectbox"/>');
            rangeSelector.appendTo(div);
            var keys = [];
            var tr =  this.getConfig('timeRanges');
            for (var prop in tr){
                keys.push(prop);
            }
            keys.sort(function(a,b){ return tr[a].order - tr[b].order })
            .forEach(function(x){
                rangeSelector.append(
                    qxWeb.create('<option/>')
                    .setProperties({
                        value: x,
                        text: x
                    })
                );
            });
            var custom = qxWeb.create('<option value="0">Custom</option>');
            rangeSelector.append(custom);
            var blockStart = false;
            var that = this;
            var onRangeSelectorChange = function(e){
                var item = tr[rangeSelector.getValue()];
                if (item){
                    if (item.end){
                        var info = that.__getRange(item);
                        if (info){
                            var range = info.range;
                            var start = info.end - range;
                            lastRange = range;
                            rrdGraphPng.setStartRange(start,range);
                            rrdGraphPng.emit('changeStartRange',{start:start,range:null});
                        }
                        else {
                            console.log("unknown end type "+item.end);
                            return;
                        }
                    }
                    else {
                        rrdGraphPng.setStartRange(rrdGraphPng.getStart(),item.len);
                        lastRange = item.len;
                    }
                }
            };
            rangeSelector.setValue(this.getConfig('initialTimeRange'));
            onRangeSelectorChange();
            rangeSelector.on('change',onRangeSelectorChange,this);


            var onChangeStartRange = function(e){
                var start = e.start;
                var range = e.range;
                if (range == null) return;
                lastRange = range;
                for (var key in tr){
                    var item = tr[key];
                    if (item.end){
                        var info = that.__getRange(item);
                        if (info){
                            var newRange = info.range;
                            var newStart = info.end - range;
                            if (Math.abs(newRange - range) / range < 0.05
                                && Math.abs(newStart - start) / range < 0.05 ) {
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
            rrdGraphPng.eq(0).on('changeStartRange',onChangeStartRange,this);

            this.on('rebindRrdGraphPng',function(){
                rrdGraphPng.eq(0).off('changeStartRange',onChangeStartRange,this);
                rrdGraphPng = this.__rrdGraphPng;
                rrdGraphPng.eq(0).on('changeStartRange',onChangeStartRange,this);
                rrdGraphPng.setRange(lastRange);
            },this);

            div.once('qxRrdDispose',function(){
                rangeSelector.off('change',onRangeChange,this);
                rrdGraphPng.eq(0).off('changeStartRange',onChangeStartRange,this);
                rangeSelector.remove();
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
