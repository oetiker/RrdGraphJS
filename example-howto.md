Howto use the example
=====================

The example consists of the Mojolicio.us "server.pl" and the frontend files in "public".

### Prerequisites: 
- Perl
- Mojolicio.us
- rrd file with some data in it.

### Procedure:
- open ./server.pl 
	edit line 5 to point to your rrd file.
- start the server using 
```shell
morbo server.pl
```
You should see "Server available at http://127.0.0.1:3000."

- point your browser at localhost:3000