function sccMap(sccObj){

	// start the loading screen
	startLoading();

	//window.location.href = "http://www.servicecanada.gc.ca/tbsc-fsco/sc-hme.jsp";

	// mapbox access token
	L.mapbox.accessToken = sccObj.accessToken;

	// service canada layers
	var scc = new L.LayerGroup();
	var so = new L.LayerGroup();
	var ptscc = new L.LayerGroup();
	var ppt = new L.LayerGroup();

	// create a marker cluster group
	var clusters = L.markerClusterGroup({
		showCoverageOnHover: false,
		spiderfyOnMaxZoom: true,
		zoomToBoundsOnClick: true,
		iconCreateFunction: function (e) {
			var t = e.getChildCount(),
			n = 40,
			r = ' marker-cluster-';
			return t < 30 ? r += 'small' : t < 90 ? (r += 'medium', n = 50)  : (r += 'large', n = 60),
			new L.DivIcon({
				html: '<div><span>' + t + '</span></div>',
				className: 'marker-cluster' + r,
				iconSize: new L.Point(n, n)
			})
		},
		// options
		spiderfyOnMaxZoom: true, showCoverageOnHover: true, zoomToBoundsOnClick: true
	});

	// function onMapLoad() {
		// alert("Map successfully loaded")
	// };

	// initalize the map
	var map = L.mapbox.map(sccObj.mapDiv, null, {
		attributionControl:{compact: true},
		zoomControl: false
	});

	//map.on('load', onMapLoad);

	map.setView([sccObj.lat, sccObj.lng], sccObj.zoom);

	map.legendControl.addLegend('<strong><b><font size="4.5px"><div align="center">Legend</div></font></b></strong>'
								+'<font size="2px"><div align="center">Points of Service as of January 2018</div></font>'
								+'<br><div class="circle red"></div>'+'<b><font color="#b43535" font size="3px">Service Canada Centre</font></b><br>'
								+'<br><div class="circle yellow"></div><b><font color="#ffc300" font size="3px">Scheduled Outreach</font></b><br>'
								+'<br><div class="circle pink"></div><b><font color="#fd14e1" font size="3px">Part-Time Service Canada Centre</font></b><br>'
								+'<br><div class="circle blue"></div><b><font color="#0000ff" font size="3px">Passport Canada</font></b>');

	// set mapbox/OSM attribution to the bottom left
	map.attributionControl.setPosition('bottomleft');

// add a scale to the map
	var scale = L.control.scale({
		position: 'bottomleft',
		maxWidth: 450
		}).addTo(map);

// initialize leaflet hashing of URL to include zoom level and coordinates
	var hash = new L.Hash(map);

// add geocoder to the map
	var geocoderControl = L.mapbox.geocoderControl('mapbox.places', {
			keepOpen: false,
			autocomplete: true,
			position: 'topright'
		}).addTo(map);

	geocoderControl.on('select', function(object){

		var coord = object.feature.geometry.coordinates;
// create a marker for geocoder search result
		var result = L.mapbox.featureLayer({
			type: 'Feature',
			geometry: {
				type: 'Point',
				coordinates: coord
			},
			properties: {
				// one can customize markers by adding simplestyle properties
				// https://www.mapbox.com/guides/an-open-platform/#simplestyle
				'marker-size': 'large',
				'marker-color': '#000000'
			}
		}).addTo(map);


// right click event when the search result is place on the map
		result.on('contextmenu', function(e) {
			var container = L.DomUtil.create('div'),
				routeDepart = routeHereDepart('<font color="green" font size="5.5px">A</font>', container);
				routeArrival = routeHereArrival('<font color="red" font size="5.5px">B</font>', container);

					L.DomEvent.on(routeDepart, 'click', function() {
					mapboxRouting.spliceWaypoints(0, 1, e.latlng);
					map.closePopup();
					});

					L.DomEvent.on(routeArrival, 'click', function() {
					mapboxRouting.spliceWaypoints(mapboxRouting.getWaypoints().length - 1, 1, e.latlng);
					map.closePopup();
					});

// offset the popup so that it is above the pin drop
			var options = {
				offset:  new L.Point(1, -20)
			};

// create the popup diaglogue
			var popup = L.popup(options)
				.setContent(container)
				.setLatLng(e.latlng, {offset:[-25, -25]})
				.openOn(map);

		});
	});

//
	var zoom = new L.Control.Zoom({
		position: 'topright'
	}).addTo(map);

// create a red icon for scc points
	var red = new L.mapbox.marker.icon({
                'marker-color': '#b43535',
				'marker-size': 'medium'
            });

// create a yellow icon for so points
	var yellow = new L.mapbox.marker.icon({
                'marker-color': '#ffc300',
				'marker-size': 'medium'
            });

// create a pink icon for ptscc
	var pink = new L.mapbox.marker.icon({
                'marker-color': '#fd14e1',
				'marker-size': 'medium'
            });

// create a blue icon for ppt
	var blue = new L.mapbox.marker.icon({
                'marker-color': '#0000ff',
				'marker-size': 'medium'
            });



// display the scc points using geojson file
	var scc_map = L.geoJson(SCC_Jan2018,{
		pointToLayer: function(feature, latlng) {
        //console.log(latlng, feature);
        return L.marker(latlng, {
			icon: red
		});
		},

		// display popup attribute information from the geojson file
		onEachFeature: function (feature, layer) {
		  var popupContent = '<strong>'+feature.properties.Site_Type+'</strong>'+
								'<br>'+'<a href="http://www.servicecanada.gc.ca/tbsc-fsco/sc-dsp.jsp?rc=' + feature.properties.POSUI + '&lang=eng" target="_blank">More Info</a>'+
								'<br>'+'<img src="http://www.servicecanada.gc.ca/profiles/images/bldg/bldg_' + feature.properties.POSUI + '.jpg" onerror="this.src=&#39;images/notavail.jpg&#39;;" width="120" height="90" />'+
								'<br>'+'<b>Centre Name: </b>'+feature.properties.Site_Name+
								'<br>'+'<b>City/Town: </b>'+feature.properties.City+
								'<br>'+'<b>Province: </b>'+feature.properties.Province;
		  if(typeof(feature.properties.Address) !== 'undefined'){
			  popupContent += "<br /><b>Address: </b>" + feature.properties.Address
		  }

			layer.bindPopup(popupContent);
		  }
	});

// right click event to route to and from points of service
	scc_map.on('contextmenu', function(e) {

			var container = L.DomUtil.create('div'),

			routeDepart = routeHereDepart('<font color="green" font size="5.5px">A</font>', container);
			routeArrival = routeHereArrival('<font color="red" font size="5.5px">B</font>', container);

					L.DomEvent.on(routeDepart, 'click', function() {
					mapboxRouting.spliceWaypoints(0, 1, e.latlng);
					map.closePopup();
					});

					L.DomEvent.on(routeArrival, 'click', function() {
					mapboxRouting.spliceWaypoints(mapboxRouting.getWaypoints().length - 1, 1, e.latlng);
					map.closePopup();
					});

			var options = {
				offset:  new L.Point(1, -20)
			};

			var popup = L.popup(options)
				.setContent(container)
				.setLatLng(e.latlng, {offset:[-25, -25]})
				.openOn(map);

	});



	// display the so points using geojson file
	var so_map = L.geoJson(SO_Jan2018,{
		pointToLayer: function(feature, latlng) {
        //console.log(latlng, feature);
        return L.marker(latlng, {
			icon: yellow
			});
			},

		// display popup attribute information from the geojson file
		onEachFeature: function (feature, layer) {
		  var popupContent = '<strong>'+feature.properties.Site_Type+'</strong>'+
								'<br>'+'<a href="http://www.servicecanada.gc.ca/tbsc-fsco/sc-dsp.jsp?rc=' + feature.properties.POSUI + '&lang=eng" target="_blank">More Info</a>'+
								'<br>'+'<img src="http://www.servicecanada.gc.ca/profiles/images/bldg/bldg_' + feature.properties.POSUI + '.jpg" onerror="this.src=&#39;images/notavail.jpg&#39;;" width="120" height="90" />'+
								'<br>'+'<b>Centre Name: </b>'+feature.properties.Site_Name+
								'<br>'+'<b>City/Town: </b>'+feature.properties.City+
								'<br>'+'<b>Province: </b>'+feature.properties.Province;
		  if(typeof(feature.properties.Address) !== 'undefined'){
			  popupContent += "<br /><b>Address: </b>" + feature.properties.Address
		  }

			layer.bindPopup(popupContent);
		  }
	});

// right click event to route to and from points of service
	so_map.on('contextmenu', function(e) {

			var container = L.DomUtil.create('div'),

			routeDepart = routeHereDepart('<font color="green" font size="5.5px">A</font>', container);
			routeArrival = routeHereArrival('<font color="red" font size="5.5px">B</font>', container);

					L.DomEvent.on(routeDepart, 'click', function() {
					mapboxRouting.spliceWaypoints(0, 1, e.latlng);
					map.closePopup();
					});

					L.DomEvent.on(routeArrival, 'click', function() {
					mapboxRouting.spliceWaypoints(mapboxRouting.getWaypoints().length - 1, 1, e.latlng);
					map.closePopup();
					});

			var options = {
				offset:  new L.Point(1, -20)
			};

			var popup = L.popup(options)
				.setContent(container)
				.setLatLng(e.latlng, {offset:[-25, -25]})
				.openOn(map);


	});

	var ptscc_map = L.geoJson(PTSCC_Jan2018,{
		pointToLayer: function(feature, latlng) {
        //console.log(latlng, feature);
        return L.marker(latlng, {
			icon: pink
			});
			},

		// display popup attribute information from the geojson file
		onEachFeature: function (feature, layer) {
		  var popupContent = '<strong>'+feature.properties.Site_Type+'</strong>'+
								'<br>'+'<a href="http://www.servicecanada.gc.ca/tbsc-fsco/sc-dsp.jsp?rc=' + feature.properties.POSUI + '&lang=eng" target="_blank">More Info</a>'+
								'<br>'+'<img src="http://www.servicecanada.gc.ca/profiles/images/bldg/bldg_' + feature.properties.POSUI + '.jpg" onerror="this.src=&#39;images/notavail.jpg&#39;;" width="120" height="90" />'+
								'<br>'+'<b>Centre Name: </b>'+feature.properties.Site_Name+
								'<br>'+'<b>City/Town: </b>'+feature.properties.City+
								'<br>'+'<b>Province: </b>'+feature.properties.Province;
		  if(typeof(feature.properties.Address) !== 'undefined'){
			  popupContent += "<br /><b>Address: </b>" + feature.properties.Address
		  }

			layer.bindPopup(popupContent);
		  }
	});

// right click event to route to and from points of service
	ptscc_map.on('contextmenu', function(e) {

			var container = L.DomUtil.create('div'),

			routeDepart = routeHereDepart('<font color="green" font size="5.5px">A</font>', container);
			routeArrival = routeHereArrival('<font color="red" font size="5.5px">B</font>', container);

					L.DomEvent.on(routeDepart, 'click', function() {
					mapboxRouting.spliceWaypoints(0, 1, e.latlng);
					map.closePopup();
					});

					L.DomEvent.on(routeArrival, 'click', function() {
					mapboxRouting.spliceWaypoints(mapboxRouting.getWaypoints().length - 1, 1, e.latlng);
					map.closePopup();
					});

			var options = {
				offset:  new L.Point(1, -20)
			};

			var popup = L.popup(options)
				.setContent(container)
				.setLatLng(e.latlng, {offset:[-25, -25]})
				.openOn(map);


	});

	var ppt_map = L.geoJson(PPT_Jan2018,{
		pointToLayer: function(feature, latlng) {
        //console.log(latlng, feature);
        return L.marker(latlng, {
			icon: blue
			});
			},

		// display popup attribute information from the geojson file
		onEachFeature: function (feature, layer) {
		  var popupContent = '<strong>'+feature.properties.Site_Type+'</strong>'+
								'<br>'+'<a href="http://www.servicecanada.gc.ca/tbsc-fsco/sc-dsp.jsp?rc=' + feature.properties.POSUI + '&lang=eng" target="_blank">More Info</a>'+
								'<br>'+'<img src="http://www.servicecanada.gc.ca/profiles/images/bldg/bldg_' + feature.properties.POSUI + '.jpg" onerror="this.src=&#39;images/notavail.jpg&#39;;" width="120" height="90" />'+
								'<br>'+'<b>Centre Name: </b>'+feature.properties.Site_Name+
								'<br>'+'<b>City/Town: </b>'+feature.properties.City+
								'<br>'+'<b>Province: </b>'+feature.properties.Province;
		  if(typeof(feature.properties.Address) !== 'undefined'){
			  popupContent += "<br /><b>Address: </b>" + feature.properties.Address
		  }

			layer.bindPopup(popupContent);
		  }
	});

// right click event to route to and from points of service
	ppt_map.on('contextmenu', function(e) {

			var container = L.DomUtil.create('div'),

			routeDepart = routeHereDepart('<font color="green" font size="5.5px">A</font>', container);
			routeArrival = routeHereArrival('<font color="red" font size="5.5px">B</font>', container);

					L.DomEvent.on(routeDepart, 'click', function() {
					mapboxRouting.spliceWaypoints(0, 1, e.latlng);
					map.closePopup();
					});

					L.DomEvent.on(routeArrival, 'click', function() {
					mapboxRouting.spliceWaypoints(mapboxRouting.getWaypoints().length - 1, 1, e.latlng);
					map.closePopup();
					});

			var options = {
				offset:  new L.Point(1, -20)
			};

			var popup = L.popup(options)
				.setContent(container)
				.setLatLng(e.latlng, {offset:[-25, -25]})
				.openOn(map);


	});

	clusters.addLayer(scc_map);
	clusters.addLayer(so_map);
	clusters.addLayer(ptscc_map);
	clusters.addLayer(ppt_map);

	map.addLayer(clusters);

// add layers control to display tile styles, and map features
	// var layerSwitcher = L.control.layers({
		// 'Mapbox': 	L.mapbox.styleLayer(sccObj.mapStyle).addTo(map).on('load', finishedLoading)
	// }, {
		// 'Service Canada Centres': scc,
		// 'Scheduled Outreach Centres': so,
		// 'Points of Service': clusters
	// },{
		// position: 'topleft'
	// }).addTo(map);




	var geoPlan = L.Routing.Plan.extend({

		createGeocoders: function() {
			var container = L.Routing.Plan.prototype.createGeocoders.call(this),

				//http://gis.stackexchange.com/questions/193235/leaflet-routing-machine-how-to-dinamically-change-router-settings

				// Create a button for google geocoding
				googleButton = createGoogleButton('<img src="images/google.png" width="20px"'+
							'style="-webkit-clip-path: inset(0 0 0px 0); -moz-clip-path: inset(0 0 0px 0); clip-path: inset(0 0 0px 0);">', container);

				mapboxButton = createMapboxButton('<img src="images/mapbox.png" width="20px"'+
							'style="-webkit-clip-path: inset(0 0 0px 0); -moz-clip-path: inset(0 0 0px 0); clip-path: inset(0 0 0px 0);">', container);

				reverseButton = createReverseButton('<img src="images/reverse.png" width="20px"'+
							'style="-webkit-clip-path: inset(0 0 0px 0); -moz-clip-path: inset(0 0 0px 0); clip-path: inset(0 0 0px 0);">', container);

				// Create a button for walking routes
				walkButton = createWalkButton('<img src="images/walk.png" width="20px"'+
							' style="-webkit-clip-path: inset(0 0 0px 0); -moz-clip-path: inset(0 0 0px 0); clip-path: inset(0 0 0px 0);">', container);

				// Create a button for biking routes
				bikeButton = createBikeButton('<img src="images/bicycle.png" width="20px"'+
							' style="-webkit-clip-path: inset(0 0 0px 0); -moz-clip-path: inset(0 0 0px 0); clip-path: inset(0 0 0px 0);">', container);

				// Create a button for driving routes
				carButton = createCarButton('<img src="images/car.png" width="20px"'+
						    ' style="-webkit-clip-path: inset(0 0 0px 0); -moz-clip-path: inset(0 0 0px 0); clip-path: inset(0 0 0px 0);">', container);

			L.DomEvent.on(googleButton, 'click', function() {
				mapboxRouting.getPlan().options.geocoder = new L.Control.Geocoder.Google();
				mapboxRouting.spliceWaypoints(mapboxRouting.getWaypoints());
				console.log("Search with Google Maps");
				}, this);

			L.DomEvent.on(mapboxButton, 'click', function() {
				mapboxRouting.getPlan().options.geocoder = new L.Control.Geocoder.mapbox(sccObj.accessToken);
				mapboxRouting.spliceWaypoints(mapboxRouting.getWaypoints());
				console.log("Search with Mapbox");
				}, this);

			L.DomEvent.on(reverseButton, 'click', function() {
				var waypoints = this.getWaypoints();
				this.setWaypoints(waypoints.reverse());
				console.log("Waypoints reversed");
				}, this);

			// Event to generate walking routes
			L.DomEvent.on(walkButton, 'click', function() {
				mapboxRouting.getRouter().options.profile = 'mapbox/walking';
				mapboxRouting.route();
				mapboxRouting.setWaypoints(mapboxRouting.getWaypoints());
				console.log("Walking route");
				}, this);

			// Event to generate biking routes
			L.DomEvent.on(bikeButton, 'click', function() {
				mapboxRouting.getRouter().options.profile = 'mapbox/cycling';
				mapboxRouting.route();
				mapboxRouting.setWaypoints(mapboxRouting.getWaypoints());
				console.log("Biking route");
				}, this);

			// Event to generate driving routes
			L.DomEvent.on(carButton, 'click', function() {
				mapboxRouting.getRouter().options.profile = 'mapbox/driving';
				mapboxRouting.route();
				mapboxRouting.setWaypoints(mapboxRouting.getWaypoints());
				console.log("Driving route");
				}, this);

			return container;
		    }
});

// Create a plan for the routing
	var plan = new geoPlan(
		// Empty waypoints
		[],
		// create a marker for routing
		{
			createMarker: function(i, wp) {
				return L.marker(wp.latLng, {
					draggable: true,
					icon: L.icon.glyph({
						glyph: String.fromCharCode(65 + i)
						})
				}).addTo(map);
			},
			// Default geocoder
			geocoder: new L.Control.Geocoder.mapbox(sccObj.accessToken),
			// Create routes while dragging markers
			routeWhileDragging: true,
			reverseWaypoints: false,
			showAlternatives: true,
		}),

		// Call the Mapbox routing engine
		mapboxRouting = L.Routing.control({
			// Empty waypoints
			waypoints: [],
			// Positioning of the routing engine in the window
			position: 'topleft',
			// Draggable routes
			routeWhileDragging: true,
			// show next fastest route
			showAlternatives: true,
			// fit route to screen
			fitSelectedRoutes: true,
			// Mapbox routing API
			router: L.Routing.mapbox(sccObj.accessToken),
			// Use the created plan for Mapbox routing
			plan: plan,
			// Show the routing icon on a reloaded window
			show: true,
			// Enable the box to be collapsed
			collapsible: true,
			// Line options,
			lineOptions: {
      styles: [{
				color: 'red',
				opacity: 1,
				weight: 8}]
			},
			// Alternative line styles
			altLineOptions: {
			styles: [{
				color: 'blue',
				opacity: 1,
				weight: 8
			}]
			}
	});

map.addControl(mapboxRouting);



		// Label the buttons for right click features
	map.on('contextmenu', function(e) {

		var container = L.DomUtil.create('div'),
			// Set a starting location for Mapbox router
			startBtn = startButton('<font color="green" font size="5.5px">A</font>', container);

			// Set a destination location for Mapbox router
			destBtn = destButton('<font color="red" font size="5.5px">B</font>', container);

		// Create a start location for the Mapbox router right click
		L.DomEvent.on(startBtn, 'click', function() {
			mapboxRouting.spliceWaypoints(0, 1, e.latlng);
			map.closePopup();
		});

		// Create a destination location for the Mapbox router click click
		L.DomEvent.on(destBtn, 'click', function() {
			mapboxRouting.spliceWaypoints(mapboxRouting.getWaypoints().length - 1, 1, e.latlng);
			map.closePopup();
		});

		L.popup()
			.setContent(container)
			.setLatLng(e.latlng)
			.openOn(map);

	});


	//-Servo's tweaks
	//var pulsingIcon = L.icon.pulse({iconSize:[10,10],color:'#ff3300'});
	//var marker = L.marker([sccObj.lat,sccObj.lng],{icon: pulsingIcon}).addTo(map);

	L.mapbox.styleLayer(sccObj.mapStyle).addTo(map).on('load', finishedLoading)

}//-main function ends
	//-RE-USABLE FUNCTIONS ========================================================================

	// create a button for geocoding result routing
	function routeHereDepart(label, container) {
	    var btn = L.DomUtil.create('button', '', container);
	    btn.setAttribute('type', 'button');
	    btn.innerHTML = label;
	    btn.title = "Set Departure Location";
	    return btn;
	}

// create a button for geocoding result routing
	function routeHereArrival(label, container) {
	    var btn = L.DomUtil.create('button', '', container);
	    btn.setAttribute('type', 'button');
	    btn.innerHTML = label;
	    btn.title = "Set Arrival Location";
	    return btn;
	}

	function startButton(label, container) {
	    var btn = L.DomUtil.create('button', '', container);
	    btn.setAttribute('type', 'button');
	    btn.innerHTML = label;
	    btn.title = "Departure Location";
	    return btn;
	}

	// Mapbox select end location button
	function destButton(label, container) {
	    var btn = L.DomUtil.create('button', '', container);
	    btn.setAttribute('type', 'button');
	    btn.innerHTML = label;
	    btn.title = "Arrival Location";
	    return btn;
	}

	// create a button for walking route
	function createWalkButton(label, container) {
	    var btn = L.DomUtil.create('button', '', container);
	    btn.setAttribute('type', 'button');
	    btn.innerHTML = label;
	    btn.title = "Walking Route";
	    return btn;
	}

// create a button for biking route
	function createBikeButton(label, container) {
	    var btn = L.DomUtil.create('button', '', container);
	    btn.setAttribute('type', 'button');
	    btn.innerHTML = label;
	    btn.title = "Biking Route";
	    return btn;
	}

// create a button for driving route
	function createCarButton(label, container) {
	    var btn = L.DomUtil.create('button', '', container);
	    btn.setAttribute('type', 'button');
	    btn.innerHTML = label;
	    btn.title = "Car Route";
	    return btn;
	}

// create a button for reversing waypoints
	function createReverseButton(label, container) {
	    var btn = L.DomUtil.create('button', '', container);
	    btn.setAttribute('type', 'button');
	    btn.innerHTML = label;
	    btn.title = "Reverse Locations";
	    return btn;
	}

// create a button for searching with Google Maps API
	function createGoogleButton(label, container) {
	    var btn = L.DomUtil.create('button', '', container);
	    btn.setAttribute('type', 'button');
	    btn.innerHTML = label;
	    btn.title = "Search with Google Maps";
	    return btn;
	}

// create a button for searching with Mapbox Geocoding API
	function createMapboxButton(label, container) {
	    var btn = L.DomUtil.create('button', '', container);
	    btn.setAttribute('type', 'button');
	    btn.innerHTML = label;
	    btn.title = "Search with Mapbox";
	    return btn;
	}

	// create a button for geocoding result routing
	function routeHereDepart(label, container) {
	    var btn = L.DomUtil.create('button', '', container);
	    btn.setAttribute('type', 'button');
	    btn.innerHTML = label;
	    btn.title = "Set Departure Location";
	    return btn;
	}

// create a button for geocoding result routing
	function routeHereArrival(label, container) {
	    var btn = L.DomUtil.create('button', '', container);
	    btn.setAttribute('type', 'button');
	    btn.innerHTML = label;
	    btn.title = "Set Arrival Location";
	    return btn;
	}
