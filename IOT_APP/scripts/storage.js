things = {}

/*
    const mockDevices = [
    {hardware_id: "raspberry", space_id: "VSS", status: "Active"},
    {hardware_id: "arduino", space_id: "VSS", status: "Active"},
    {hardware_id: "chromecast", space_id: "VSS", status: "Active"}
    ];

*/

function store_Things(things){
    localStorage.setItem('things', JSON.stringify(things));
}

function get_Things(){
    const data = localStorage.getItem('things');
    return data ? JSON.parse(data) : [];
}

services = {}

/*
    const mockServices = [
    { service_name: "Living Room Light", service_id : "led_4", API : "spaceholder", thing_id : "raspberry", type: "Actuator", status: "Active" },
    { service_name: "Kitchen Temp Sensor", service_id : "temp_sens_1", API : "spaceholder",  thing_id : "raspberry", type: "Sensor", status: "Active" },
    { service_name: "Front Door Lock", service_id : "lock_00", API : "spaceholder",  thing_id : "arduino",  type: "Actuator", status: "Offline" },
    { service_name: "Desk workers monitor", service_id : "monitor_1", API : "spaceholder",  thing_id : "chromecast", type: "Sensor", status: "Offline" },
    { service_name: "Laser", service_id : "laser_111", type: "Actuator", API : "spaceholder",  thing_id : "raspberry", status: "Offline" }
    ];
*/

function store_Services(services){
    localStorage.setItem('services', JSON.stringify(services));
}

function get_Services(){
    const data = localStorage.getItem('services'); 
    return data ? JSON.parse(data) : [];   
}

relationships = {}

/*
    const mockRelationships = [
    // Condition-based: B runs if A returns a specific value
    {nameA: "Kitchen Temp Sensor",nameB: "Smart Fan", typeA: "Sensor", typeB: "Actuator", type: "condition", condition: "> 25°C", status: "Active"},
    {nameA: "Front Door Lock",nameB: "Hallway Light", typeA: "Actuator",typeB: "Actuator",type: "condition", condition: "Unlocked",status: "Active"},
    {nameA: "Security System",nameB: "Email Notifier", typeA: "Actuator",typeB: "Service",type: "order",condition: null, status: "Active"},
    {nameA: "Morning Alarm", nameB: "Coffee Maker", typeA: "Service", typeB: "Actuator", type: "order", condition: null, status: "Offline"}
    ];
*/

function store_Relationships(relationships){
    localStorage.setItem('relationships', JSON.stringify(relationships));
}

function get_Relationships(){
    const data = localStorage.getItem('relationships');
    return data ? JSON.parse(data) : [];
}