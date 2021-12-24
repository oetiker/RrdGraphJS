<?php

//
// ::: Overview :::
//
// This is a PHP example that is used by the RrdGraphJS routines.  It graphs
// the barometric pressure using data collected in Wakefield, Québec, Canada.
//
// Try it:
//
//    https://weather.hillsandlakes.com/dyna_rrd_eg.html
//
// ::: Background :::
//
// `dyna_rrd_eg.html' is based `public/index.html' code.  `dyna_rrd_eg.html' calls
// this script to generate the RRD Graph.
// 
// An additional parameter is passed to this script:  uom (unit of measure).
//
// The uom is used to generate the graph using metric or imperial units.  The above
// link implements the metric flavor.
//
// ::: Technical Overivew :::
//
// This script is very simple:
//
// 1) Create the requested pressure RRD graph on disk
// 2) Send the graph contents to the browser and delete the graph file
//
// Tips
// ----
// o Set $debug to non-zero to get instrumentation written to the Apache error log
//
// ::: Source :::
//
// https://github.com/oetiker/RrdGraphJS
//

//
// *** Functions ***
//
function log_start_time(&$start_time) {
  global $debug;

  if ($debug) {
    $start_time = microtime(true);
  }
}

function log_end_time($start_time, $msg) {
  global $debug;

  if ($debug) {
    $end_time = microtime(true);

    error_log($msg . ": " . number_format(($end_time - $start_time), 4) . "s");
  }
}

//
// Dump our HTML arguments to the Apache error log
//
function argument_dump() {
  global $debug;

  if ($debug) {
    ob_start();
    var_dump($_REQUEST);
    error_log(ob_get_clean());
  }
}

//
// If debug is enabled, writes a message to the Apache error log
//
function debug_msg($msg) {
  global $debug;

  if ($debug) {
    error_log($msg);
  }
}

function cat_rm_image_stdout($image) {
  $fp = fopen($image, 'rb');

  //
  // Send the headers
  //
  header("Content-Type: image/png");
  header("Content-Length: " . filesize($image));

  //
  // Dump the picture ...
  //
  fpassthru($fp);

  //
  // and delete it.
  //
  unlink($image);
}

function graph_pressure($rrd, $image) {
  global $graph_errors;
    
  $options =
    array(
          "--start", $_REQUEST["start"],
          "--end", $_REQUEST["end"],
          "--imgformat=PNG",
          "--width=" . ($_REQUEST["width"] - 81),    // see comments in .html file why we subtract
          "--height=" . ($_REQUEST["height"] - 68),  // see comments in .html file why we subtract
          "--rigid",
          "--alt-y-grid",
          "--alt-autoscale-min",
          "--no-minor",
          "--units-exponent=0",
          "--pango-markup",
          "--tabwidth=40",
          "--color=MGRID#c1c1c1",
          "--color=ARROW#ff0000",
          "VRULE:1639803600#db7093",
          "DEF:barometer=$rrd:barometer:AVERAGE",
          );

  //
  // Here's how we handle the requested uom (unit of measure).
  //
  //    m = metric / i = imperial
  //
  if ($_REQUEST["uom"] == "m") {
      array_push($options,
                 "--title=Barometric Pressure in Hectopascal (hPa)",
                 "CDEF:conv_barometer=barometer",
      );
      $precision = "0.1";
  }
  else { // imperial units
      array_push($options,
                 "--title=Barometric Pressure in Inches of Mercury",
                 "CDEF:conv_barometer=barometer,33.86388158,/",
      );
      $precision = "0.2";
  }

  array_push($options,
             "VDEF:last_barometer=conv_barometer,LAST",
             "VDEF:max_barometer=conv_barometer,MAXIMUM",
             "VDEF:min_barometer=conv_barometer,MINIMUM",
             "LINE1:conv_barometer#000066",
             "GPRINT:max_barometer:Max\: %-" . $precision . "lf",
             "GPRINT:max_barometer:@ %R on %F:strftime",
             "GPRINT:min_barometer:\tMin\: %-" . $precision . "lf",
             "GPRINT:min_barometer:@ %R on %F:strftime",
             "GPRINT:last_barometer:\t  Last\: %-" . $precision . "lf\l",
  );

  $status = rrd_graph($image, $options);
  if (! $status) {
      error_log("graph_pressure(): " . rrd_error());
      $graph_errors++;
  }
}

//
// *** Configuration ***
//

//
// Set to non-zero to dump debug to the Apache error log
//
$debug = 0;

//
// Instrumentation - written to errorlog when $debug is non-zero.
//
$start_time = 0.0;

//
// RRD files relative to our script.
//
$rrd_dir = "rrd/";
$weather_pressure = $rrd_dir . "weather_pressure.rrd";

$graph_dir = "graphs/";
$pressure_graph = $graph_dir . "pressure_" . $_REQUEST["rand"] . ".png";

//
// Track graphing errors
//
$graph_errors = 0;

//
// *** Main ***
//
log_start_time($start_time);

graph_pressure($weather_pressure, $pressure_graph);

if ($graph_errors == 0) {
   cat_rm_image_stdout($pressure_graph);
}

log_end_time($start_time, "Done");
?>
