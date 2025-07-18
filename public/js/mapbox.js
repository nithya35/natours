export const displayMap = (locations)=>{
    mapboxgl.accessToken = 'pk.eyJ1Ijoibml0aHlhMjYzIiwiYSI6ImNtY2czZmhhdzBma2EyanNlZnVodXZsNHcifQ.JXqEK9sbqXp1NELSGiFZTw';

    var map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/nithya263/cmchxu68b008e01sbev6cbidi',
        scrollZoom: false
    });

    const bounds = new mapboxgl.LngLatBounds();

    locations.forEach(loc=>{
        //create marker
        const el = document.createElement('div');
        el.className = 'marker';

        //add marker
        new mapboxgl.Marker({
            element: el,
            anchor: 'bottom'
        }).setLngLat(loc.coordinates).addTo(map);

        //add popup
        new mapboxgl.Popup({
            offset: 30
        })
        .setLngLat(loc.coordinates)
        .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
        .addTo(map);

        //extend map bounds to include current location
        bounds.extend(loc.coordinates);
    });

    map.fitBounds(bounds,{
        padding: {
            top: 200,
            bottom: 150,
            left: 50,
            right: 50
        }
    });
}
