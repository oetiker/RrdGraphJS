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
            rangeMatchPrecision: 0.05,
            showTimeBox: true,
            resetTimeOnDateChange: false,
            switchToCustomOnStartChange: true,
            momentTz: null
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
        init: function(rrdGraphPng,cfg){
            if (!this.base(arguments)) {
                return false;
            };
            if (cfg){
                for (var key in cfg){
                    this.setConfig(key,cfg[key])
                }
            }
            this._forEachElementWrapped(function(div,idx) {
                div.setProperty('rrdGraphPng',rrdGraphPng);
                div.__addDatePicker();
                div.__addRangePicker();                
            });
            return true;
        },
        rebind: function(rrdGraphPng){
            this._forEachElementWrapped(function(div,idx) {
                div.setProperty('rrdGraphPng',rrdGraphPng);
                div.emit('rebindRrdGraphPng');
                rrdGraphPng.setStartRange(div.getProperty('start'),div.getProperty('range'));
            });
        },
        __addDatePicker: function(){
            var rrdGraphPng = this.getProperty('rrdGraphPng');
            var start = qxWeb.create('<input  type="text"/>');
            start.appendTo(this);
            var picker = start.datepicker().setConfig('format', function(date) {
                return date.toDateString();
            });
            var calendar = picker.getCalendar();
            calendar.setValue(new Date());

            var timeBox = qxWeb.create('<input class="qx-datepicker" size="10" type="text" value="00:00:00" />');
            if (! this.getConfig('showTimeBox')){
                timeBox.hide();
            }
            timeBox.appendTo(this);
            var that = this;
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
                var momentTz = that.getConfig('momentTz');
                if (momentTz){
                    start = parseInt(moment.tz(moment(calendar.getValue()).format("YYYY-MM-DD"),momentTz).format('X'));
                }
                else {
                    start = calendar.getValue().getTime()/1000
                }
                start += time[0]*3600+time[1]*60+time[2];
                rrdGraphPng.setStart(start);
                that.setProperty('start',start);
                that.emit('syncRrdGraphCtrlRange',start);                                                
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
                propagateDateTime();
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
            var that = this;
            var onChangeStartRange = function(e){
                var start = e.start;
                var range = e.range;
                if (isNaN(start)) return;
                var momentTz = this.getConfig('momentTz');
                var date;
                
                if (momentTz){
                    date = new Date(moment.tz(start * 1000,momentTz).format("YYYY-MM-DD HH:mm:ss"));
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
                that.setProperty('start',start);
            };
            rrdGraphPng.eq(0).on('changeStartRange',onChangeStartRange,this);

            var onRebindRrdGraphPng = function(){
                rrdGraphPng.eq(0).off('changeStartRange',onChangeStartRange,this);
                rrdGraphPng = this.getProperty('rrdGraphPng');
                rrdGraphPng.eq(0).on('changeStartRange',onChangeStartRange,this);
            };
            this.on('rebindRrdGraphPng',onRebindRrdGraphPng,this);
     
            this.once('qxRrdDispose',function(){
                this.off('rebindRrdGraphPng',onRebindRrdGraphPng,this);
                rrdGraphPng.eq(0).off('changeStartRange',onChangeStartRange,this);
                timeBox.off('change',propagateDateTime,this);
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

        __addRangePicker: function(){
            var rrdGraphPng = this.getProperty('rrdGraphPng');

            var rangeSelector = qxWeb.create('<select class="qx-widget qx-selectbox"/>');
            this.setProperty('rangeSelector',rangeSelector);
            rangeSelector.appendTo(this);
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
                            that.setProperty('range',range);
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
                        that.setProperty('range',item.len);
                    }
                }
            };
            rangeSelector.setValue(this.getConfig('initialTimeRange'));
            rangeSelector.on('change',onRangeSelectorChange,this);

            onRangeSelectorChange();

            var precision = this.getConfig('rangeMatchPrecision');
            var that = this;
            var onChangeStartRange = function(e){
                var start = e.start;
                var range = e.range;
                if (range == null) return;
                that.setProperty('range',range);
                for (var key in tr){
                    var item = tr[key];
                    if (item.end){
                        var info = that.__getRange(item);
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
                onChangeStartRange({start:start,range:this.getProperty('range')});
            };
            
            this.on('syncRrdGraphCtrlRange',onSyncRange,this);
            

            rrdGraphPng.eq(0).on('changeStartRange',onChangeStartRange,this);

            var onRebindRrdGraphPng =  function(){
                rrdGraphPng.eq(0).off('changeStartRange',onChangeStartRange,this);
                rrdGraphPng = this.getProperty('rrdGraphPng');
                rrdGraphPng.eq(0).on('changeStartRange',onChangeStartRange,this);
                rrdGraphPng.setRange(this.getProperty('range'));
            };
            this.on('rebindRrdGraphPng',onRebindRrdGraphPng,this);
            
            this.once('qxRrdDispose',function(){
                this.off('rebindRrdGraphPng',onRebindRrdGraphPng,this);
                this.off('syncRrdGraphCtrlRange',onSyncRange,this);
                rangeSelector.off('change',onRangeChange,this);
                rrdGraphPng.eq(0).off('changeStartRange',onChangeStartRange,this);
                rangeSelector.remove();
            },this);
        },
        dispose: function(){
            this._forEachElementWrapped(function(ctrl) {
                ctrl.emit('qxRrdDispose');
            });
            return this.base(arguments);
        }
    },

    defer : function(statics) {
        qxWeb.$attach({rrdGraphCtrl : statics.rrdGraphCtrl});
    },

});
