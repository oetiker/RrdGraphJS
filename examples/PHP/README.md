# PHP Example
This PHP working example graphs live, barometric pressure.  The
assumption is that people will take the code and molded to their
needs.  The code has ample documentation to guide a novice PHP
developer.

## HTML
The HTML code is based on the project's `../../public/index.html` file.

## Live site
This code is implemented at the link below using live, weather station
data gathered in Wakefield, Québec, Canada:

https://weather.hillsandlakes.com/dyna_rrd_eg.html

## Performance
The server-side script is light-weight however the server impact is
determined by the date range of the graph and the number of concurrent
calls. 

On a lightly used Virtual Machine (gnerally %99 idle), one CPU with a
4,000 bogomips rating, 1G of RAM, the execution times of this script were:

    0.0171s, 0.0146s, 0.0151s, 0.0158s, 0.0374s, 0.0151s, 0.0167s, 0.0201s
    0.0205s, 0.0211s, 0.0198s, 0.0198s, 0.0182s, 0.0199s, 0.0164s, 0.0223s
    0.0160s, 0.0182s, 0.0202s, 0.0442s, 0.0169s, 0.0168s, 0.0169s, 0.0164s

### Multiple charts

If more than one RRD graph is required, to reduce impact on the
server, the following strategy is suggested:

1. Generate all the charts
2. Merge them into a new image
3. Return the new image to the browser

The above strategy avoids having one PHP script per image.
