#!/usr/bin/env perl
use Mojolicious::Lite;
use RRDs;

my $rrd_file = './my-data.rrd';

get '/' => sub {
    my $self = shift;
    $self->redirect_to('/index.html');
};

get '/graph:l' => sub {
    my $c =shift;

    my %p;
    for ('start', 'end', 'width', 'height'){
        $p{$_} =  $c->param($_);
    }

    my $num_days=30;
    my $graph = RRDs::graphv(
            '--start', $p{start},
            '--end', $p{end},
            '-w', $p{width}, '-h', $p{height},
            '-',
            "DEF:solar=$rrd_file:watt:AVERAGE",
            'AREA:solar#03bde9'
        );
    if(my $error = RRDs::error){
        return $c->render(status=>400,text=>"graph generation error: $error");
    }

    $c->render(data =>$graph->{image}, format=>'png');

};

app->start;
