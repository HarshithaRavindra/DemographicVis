function yourInitFunction(array,x)
{

  queue()
  .defer(d3.csv,"data/data.csv?_="+ Math.random())
  .defer(d3.csv,"data/metadata.csv?_="+ Math.random())
  .await(function(error, data, meta_data) {
    var cols = array;
    //filters out the values which does not need row chart representation
    var field = Object.keys(data[0]);
    var configArray = cols.filter(function(col) {
      return col!= 'Latitude' && col!= 'Longitude' && col!= 'none' && col!=null && col!= 'Date' ;
    });
    var dateFormat = d3.time.format("%d-%m-%y");
    console.log(data)
    data.forEach(function(d) {
      d["Date"] = dateFormat.parse(d["Date"]);
    });

    var divs = d3.select('#wrap').selectAll('div.mychart').data(configArray);
    divs.enter().append('div').attr('class','mychart').attr('class','chart-wrapper');
    //Crossfilter for file1
    var cf = crossfilter(data);
    var dateDim = cf.dimension(function(d) { return d["Date"]; });
    var numRecordsByDate = dateDim.group();
    var minDate = dateDim.bottom(1)[0]["Date"];
    var maxDate = dateDim.top(1)[0]["Date"];
    var timeChart = dc.barChart("#time-chart");
    var allDim = cf.dimension(function(d) {return d;});
    //Crossfilter for file2
    var cff = crossfilter(meta_data);
    var allDimm = cff.dimension(function(d){ return d;});
    var all = cf.groupAll(); //all for crossfilter 1 
    var all2 = cff.groupAll();    
    var bar;

    timeChart
    .width(650)
    .height(140)
    .margins({top: 10, right: 50, bottom: 20, left: 20})
    .dimension(dateDim)
    .group(numRecordsByDate)
    .transitionDuration(500)
    .x(d3.time.scale().domain([new Date(2014, 1, 1), maxDate]))
    .elasticY(true)
    .yAxis().ticks(4);
    // console.log("configArray length: ", configArray, configArray.length)
    var dcCharts = new Array(configArray.length);
    console.log(divs)
    divs.each(function(col,i) {
      console.log(col,i)
      var dimension = cf.dimension(function(d) {  return (d[col]) ; });
      var group = dimension.group(); 
      
      console.log("What is this",this);// or however you want to bin them

      bar = dc.rowChart(this) // pass div element as parent/root instead of using selector
          .dimension(dimension)
          .group(group)
          .height(300)
          .width(400)
          .elasticX(true)

          .margins({ top: 10, left: 30, right: 10, bottom: 50 })
          .renderlet(function (chart) {
            chart.selectAll("g.x text")
              .attr('dx', '-90')
              .attr('transform', "rotate(-90)");
          })                   
        .data(function (group) { return group.top(10)});

      dcCharts[i] = bar;
      var node = document.createElement("h5");
      var textnode = document.createTextNode(configArray[i]);
      node.appendChild(textnode);
      document.getElementsByClassName("chart-wrapper dc-chart")[i].appendChild(node);
       
    });

    dcCharts.push(timeChart)
    var visCount = dc.dataCount(".dc-data-count");
    visCount
      .dimension(cf)
      .group(all);

    if(x==true)
    {
      console.log("Ran coz map is true");
      var mainmap;
      var heat;
      
      mapLink = '<a href="https://openstreetmap.in/demo">OpenStreetMap</a>';
      mainmap = L.tileLayer(
        'https://{s}.tiles.mapbox.com/v4/openstreetmap.1b68f018/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiaGFyc2hpdGhhcmF2aW5kcmEiLCJhIjoiY2pseGtyNXU0MWZtYTNwcW5tM2Y4cnRjNCJ9.zlFeO5rHF5shM4TjIh_aFg', 
        {
          attribution: '&copy; ' + mapLink + ' Contributors',
          maxZoom: 15,     
        });
        //HeatMap
      var geoData = [];
      _.each(allDim.top(Infinity), function(d) {
        geoData.push([d["Latitude"], d["Longitude"], 1]);
      });

      //geodata for file2
      var geoDataa =[];
      _.each(allDimm.top(Infinity), function(d){
        geoDataa.push([d["Latitude"], d["Longitude"], 1]);
      });

      heat = L.heatLayer(geoData,{
        radius: 10,
        blur: 10, 
        maxZoom: 1,
      });
      console.log("Ran heatmap layer");
      var markerLayer = L.heatLayer(geoDataa, {
          radius: 10,
          blur: 30, 
          maxZoom: 1,
          gradient: {
            0.0: 'yellow',
            0.5: 'cyan',
            1.0: 'black'
          },
      });
     
      var map = L.map('map',{
      layers: [mainmap, heat, markerLayer]

    });
    map.setView([22.97, 100.65], 4);
     
    var baseMaps = {
        "BaseMap": mainmap      
      };

    var overlayMaps = {
        "Primary": heat,
        "Metadata": markerLayer 
      };


    mainmap.addTo(map);
    L.control.layers(baseMaps,overlayMaps).addTo(map); 

    drawMap = function(){ 
      mainmap.addTo(map);
      geoData=[];
       _.each(allDim.top(Infinity), function (d) {
        geoData.push([d["Latitude"], d["Longitude"], 1]);
      });

      heat = L.heatLayer(geoData,{
        radius: 10,
        blur: 20, 
        maxZoom: 1 
      });

      mainmap.addTo(map);
          //L.control.layers(baseMaps,overlayMaps).addTo(map);
      heat.addTo(map);
    
    };          
      
    //Update the heatmap if any dc chart get filtered
    console.log(dcCharts);
    _.each(dcCharts, function (dcChart) {
        console.log(dcChart);
        dcChart.on("filtered", function (chart, filter) {
            map.eachLayer(function (layer) {
              console.log(layer);
              map.removeLayer(layer)
              mainmap.addTo(map);
            }); 
            console.log("Yes, I am called");
        drawMap();
        });
        dc.renderAll();
      });
      console.log("I am here inside if loop of map"); 
    }        
    dc.renderAll();
    console.log("The last rendering is successful");
  });
}