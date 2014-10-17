var margin, width, height;

$(document).ready(function(){		//When the document is ready...
	console.log('document ready');
	// Layout
	margin = {top: 20, right: 10, bottom: 20, left: 60};
	width  = window.innerWidth - 40 - margin.left - margin.right;
	height = window.innerHeight/2 - 20 - margin.top - margin.bottom;	

	// Data/Chart
	app.setup();

	// Audio
	var audioTracks = document.getElementsByTagName('audio');
	for(var i = 0; i < audioTracks.length; i++){
		$(audioTracks[i]).bind('loadedmetadata', function() {
			console.log('metadata loaded for ' + this);
			audioPlayer.setup(this);
		});
	}
});

var audioPlayer = {};
audioPlayer.setup = function(myAudio){
	console.log('called audioPlayer setup');
	var audioTracks = document.getElementsByTagName('audio');
	var ranges = document.getElementsByTagName('input');	
	var seek;
	var index;
	for(var i = 0; i < audioTracks.length; i++){
		if(audioTracks[i] == myAudio){
			seek = ranges[i];
			index = i + 1;
			// console.log(seek);
		}
	}
	// Setting input:range attributes
	$(seek).attr('max', myAudio.duration)
			  .css({
			  	'position': 'absolute',
			  	'left': margin.left,
			  	'top': index * (height + margin.top + margin.bottom),
			  	'width': width + 'px'
			  });

	// Position title divs
	var titles = document.getElementsByTagName('h2');
	var thisTitle = titles[index];
	$(thisTitle).css({
			  	'top': index * (height + margin.top + margin.bottom),
			  });

	// Create, style and append button
	var btPlayPause = $('<button type=\'button\'>loading</button>')
					 .css({
					  	'position': 'absolute',
					  	'left': 0,
					  	'top': index * (height + margin.top + margin.bottom),
					  	'width': margin.left
					 });
	$('body').append(btPlayPause);

	// Create, style and append time
	var time = $('<div class=\'timer\'>00:00:00</div>')
					 .css({
				  	'position': 'absolute',
				  	'left': margin.left,
				  	'top': index * (height + margin.top + margin.bottom) + 20,
				  	'width': 40
				 });
	$('body').append(time);

	/*--------------- LISTENERS ---------------*/
	// Seek changes audio
	$(seek).bind('change', function() {
		myAudio.currentTime = $(this).val();
		$(time).html(secToTime($(this).val()));
		// console.log($(this).val());
		// console.log(myAudio.currentTime);
	});

	// Audio updates seek
	myAudio.addEventListener('timeupdate',function (){
	    var currTime = parseInt(this.currentTime, 10);
        $(seek).attr('value', currTime);
        $(time).html(secToTime(currTime));
    });

	myAudio.addEventListener('canplaythrough', function(){
		
		console.log('can play ' + myAudio);
		console.log(myAudio.paused);
		$(btPlayPause).html('play');

		$(btPlayPause).bind('click', function() {
		  	if(!myAudio.paused){
				myAudio.pause();
				this.innerHTML = 'play';
				console.log('paused: ' + myAudio);
		  	}else{
				myAudio.play();
				this.innerHTML = 'pause';
				console.log('playing: ' + myAudio);
		  	}
		});

		$('body').append(btPlayPause);					
	});

	var secToTime = function(time){
		var h = Math.floor(time/3600);
		var m = Math.floor((time - h * 3600)/60);
		var s = time % 60;
		if(h < 10){
			h = '0' + h;
		}
		if(m < 10){
			m = '0' + m;
		}
		if(s < 10){
			s = '0' + s;
		}
		return h + ':' + m + ':' + s;
	}

}

var app = {};
app.setup = function(){

	console.log('called app setup');

	var svg1 = d3.select('body')
				.append('svg')
				.attr('left', 0)	
				.attr('top', 0)
				.attr('width', width + margin.left + margin.right)
			    .attr('height', height + margin.top + margin.bottom)
			  	.append('g')
			    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

	var svg2 = d3.select('body')
				.append('svg')
				.attr('left', 0)	
				.attr('top', window.innerHeight/2)
				.attr('width', width + margin.left + margin.right)
			    .attr('height', height + margin.top + margin.bottom)
			  	.append('g')
			    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

	d3.xml('data/city_of_angels.xml', 'application/xml', function(error, xml) {
		if (error) return console.warn(error);
		drawAreaChart(xml, svg1);
	});
	
	d3.json("data/city_of_angels_subtitles.json", function(error, json) {
	  if (error) return console.warn(error);
		  drawSubtitles(json.subs, svg1);
	});

	d3.xml('data/wings_of_desire.xml', 'application/xml', function(error, xml) {
		if (error) return console.warn(error);
		drawAreaChart(xml, svg2);
	});

	d3.json("data/wings_of_desire_subtitles.json", function(error, json) {
	  if (error) return console.warn(error);
		  drawSubtitles(json.subs, svg2);
	});


	function drawSubtitles(dataset, svg){
		var xScale = d3.scale.linear()
						.domain([0, dataset[dataset.length - 1].end])
						.range([0, width]);

	  	svg.selectAll('rect')
	  		.data(dataset)
	  		.enter()
	  		.append('rect')
	  		.attr('x', function(d, i){
	  			return xScale(d.start);
	  		})
	  		.attr('y', height)
	  		.attr('width', function(d, i){
	  			return xScale(d.end - d.start);
	  		})
	  		.attr('height', 10)
	  		.attr('fill', 'rgb(255, 0, 0)');
	}

	function drawAreaChart(xml, svg){
		var dataset = xml.documentElement.getElementsByTagName('VOL');

		var xScale = d3.scale.ordinal()
						.domain(d3.range(dataset.length))
						.rangeBands([0, width]);

		var yScale = d3.scale.linear()
						.domain([0, d3.max(dataset, function(d, i){
														return d.textContent;
													})])
						.range([height, 0]);

		var area = d3.svg.area()
					    .x(function(d, i) { return xScale(i); })
					    .y0(height)
					    .y1(function(d) { return yScale(d.textContent); });		    			 

	/*
	// You can do either:
	  svg.append("path")
	      .datum(dataset)
	      .attr("class", "area")
	      .attr("d", area);
		});	
	// or: */
	  svg.append("path")
	      // .datum(dataset)
	      .attr("class", "area")
	      .attr("d", area(dataset));
	}
}
