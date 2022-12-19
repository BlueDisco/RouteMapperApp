/*
  This app serves as a route maker with a slightly inaccurate location tracking service. 
  Loading up the app, you are presented with a map and a single button on your screen. You press the button and it brings you to your current location.
  Suddenly, some information pops up on the top and another button appears. The start conditions turns true which makes these components pop up. The green marker labeled "Start"
  pops up at where you are standing. A timer is ticking on the top and the distance and speed displays 0. You try moving and these values don't update, but suddenly, a line pops up
  on the screen and these values both update (after walking around 10 meters from the start). 

  After running a while, you decide to stop the route. Pressing these buttons always zooms you in to your current location.
  A red marker labeled "End" appears. The information on the top disappears and a summary button appears on the bottom. 
  Some conditions must have turned true to allow this happen. A modal of your run's summary appears when you press this button. 
  Pressing the red button again deletes your route and resets everything back to zero. Pressing the green button starts an entire new route with a new marker and all the info at 
  default values. 

  Some caveats:
  -The user location sometimes goes haywire even though there isn't no movement, causing it to go haywire and showing that by drawing out of place polylines. (Same goes for distance and speed)
  -If the time goes too high (in the many hours), it will go off the edge of the screen.
  -The average speed might not work if you don't walk enough (for the summary modal)
*/
import React, { useState, useEffect , useRef} from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Modal,
} from "react-native";
import MapView from "react-native-maps";

export default function MapScreen({ route, navigation }) {
  const [userCoords, setUserCoords] = useState()
  const [routeCoords, setRouteCoords] = useState([])
  const [start, setStart] = useState(false)
  const [stop, setStop] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [time, setTime] = useState(null)
  const [totalSeconds, setTotalSeconds] = useState(0)
  const [speed, setSpeed] = useState(0)
  const [speeds, setSpeeds] = useState([])
  const [startTime, setStartTime] = useState(null)
  const [totalDistance, setTotalDistance] = useState(0)
  const _map = useRef(null)

  useEffect(() => {
    if (start) {
      let tempDistance = 0
      if (routeCoords.length == 0) {
        setRouteCoords([userCoords])
      } else {
        tempDistance = calcDistance(
          userCoords.latitude,
          userCoords.longitude,
          routeCoords[routeCoords.length - 1].latitude,
          routeCoords[routeCoords.length - 1].longitude,
        );
      }

      if (tempDistance > 10) {
        setTotalDistance((prev) => prev + Math.round(tempDistance));
        setRouteCoords((prev) => [...prev, userCoords]);
        setSpeeds((prev) => [...prev, speed])
      }
    }

    if (stop) {
      setRouteCoords((prev) => [...prev, userCoords]);
    }

  }, [userCoords])

  useEffect(() => {
    if (start) {
      if (startTime === null) {
        setStartTime(Math.floor(+new Date() / 1000));
        setTime(0 + ' s')
      } else if (!stop) {
        setTimeout(() => {
          let difference = Math.floor(+new Date() / 1000) - startTime;
          let output = ""

          if (difference - totalSeconds > 1) {
            difference--;
            setStartTime(prev => prev + 1)
          }   

          console.log(difference - totalSeconds)

          output = difference % 60 + ' s'

          if (difference / 60 >= 1) {
            output = Math.floor((difference % 3600) / 60) + ' m ' + output

            if (difference / 3600 >= 1) {
              output = Math.floor((difference % (3600 * 24)) / 3600) + ' h ' + output 
            }
          }

          setTotalSeconds(difference)
          setTime(output)
          setSpeed((totalDistance / difference) != 0 ? (totalDistance / difference).toFixed(2) : 0)  
        }, 1000);
      }
    }
  }, [start, time]);

  function changeLocation(e) {
    if (!stop) {
      setUserCoords(e.nativeEvent.coordinate);
    }
  }

  function calcDistance(lat1, lon1, lat2, lon2) {
    var R = 6371;
    var dLat = convertToRad(lat2 - lat1);
    var dLon = convertToRad(lon2 - lon1);
    var lat1 = convertToRad(lat1);
    var lat2 = convertToRad(lat2);

    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d * 1000;
  }

  function convertToRad(degrees) {
    return (degrees * Math.PI) / 180;
  }

  function startRoute() {
    if (!stop) {
      setStart(true)
    }

    _map.current.fitToElements()
  }

  function stopRoute() {
    setStart(false)
    setStop(true)
    if (routeCoords.length > 0) {
      _map.current.fitToCoordinates(routeCoords);
    } 
  }

  function resetRoute() {
    setStop(false)
    setTotalDistance(0)
    setStartTime(null)
    setRouteCoords([])
    setSpeeds([])
  }
  
  function SummaryModal() {
    let avgSpeed = 0

    for (let i = 0; i < speeds.length; i++) {
      avgSpeed += speeds[i]
    }

    if (speeds.length > 0) {
      avgSpeed = (avgSpeed / speeds.length).toFixed(2);
    } else {
      avgSpeed = 0
    }

    return (
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <View style={[styles.container, {justifyContent: 'center'}]}>
          <View style={styles.modalView}>
            <View style={styles.topModal}>
              <Image
                source={require("./icons/running.png")}
                style={[styles.image]}
                resizeMode="contain"
              />
            </View>

            <View style={styles.middleModal}>
              <Text style={[styles.modalText, {fontWeight: 'bold'}]}>You ran for:  </Text>
              <Text style={styles.modalText}>a time of: 
                <Text style={{color: '#AE00FB'}}> {time}</Text>,
              </Text>
              <Text style={styles.modalText}>a distance of: 
                <Text style={{color: '#AE00FB'}}> {totalDistance} m</Text>,
              </Text>
              <Text style={styles.modalText}>and an average speed of: 
                <Text style={{color: '#AE00FB'}}> {avgSpeed} m/s</Text>
              </Text>
            </View>

            <View style={styles.bottomModal}>
              <TouchableOpacity
                onPress={() => setModalVisible(!modalVisible)}
                style={styles.modalButton}
              >
                <Text style={styles.modalButtonText}>
                  OK
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    )
  }
  
  return (
    <View style={styles.container}>
      
      <SummaryModal/>

      <MapView
        ref={_map}
        style={styles.map}
        showsUserLocation={true}
        showsIndoors={false}
        onUserLocationChange={(e) => changeLocation(e)}
      >
        {routeCoords.length > 1 ? (
          <MapView.Polyline
            coordinates={routeCoords}
            strokeColor={"#000"}
            strokeWidth={3}
          />
        ) : null}

        {routeCoords.length > 0 ? (
          <MapView.Marker
            coordinate={routeCoords[0]}
            pinColor="green"
            title="Start"
          />
        ) : null}

        {!start && routeCoords.length > 0 ? (
          <MapView.Marker
            coordinate={routeCoords[routeCoords.length - 1]}
            pinColor="red"
            title="End"
          />
        ) : null}
      </MapView>

      {start ? (
        <View style={styles.infoContainer}>
          <View style={styles.iconContainer}>
            <Image
              source={require("./icons/shoe.png")}
              style={[styles.image, { height: "50%", width: "50%" }]}
              resizeMode="contain"
            />
            <Text style={styles.buttonText}>
              : {totalDistance} m
            </Text>
          </View>
          <View style={styles.iconContainer}>
            <Image
              source={require("./icons/speed.png")}
              style={[styles.image, { height: "50%", width: "50%" }]}
              resizeMode="contain"
            />
            <Text style={styles.buttonText}>: {speed} m/s</Text>
          </View>
          <View style={styles.iconContainer}>
            <Image
              source={require("./icons/timer.png")}
              style={[styles.image, { height: "40%", width: "40%" }]}
              resizeMode="contain"
            />

            <Text style={styles.buttonText}>: {time} </Text>
          </View>
        </View>
      ) : null}

      <View style={styles.buttonContainer}>
        {!start && stop ? (
          <View style={styles.leftButtonContainer}>
            <TouchableOpacity style={styles.summaryButton} onPress={() => setModalVisible(!modalVisible)}>
              <Text style={[styles.buttonText, { fontSize: 20 }]}>
                Run Summary
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.rightButtonContainer}>
          <TouchableOpacity
            style={styles.startButtonStyle}
            onPress={startRoute}
          >
            <Image
              source={
                start || stop
                  ? require("./icons/navigation.png")
                  : require("./icons/running.png")
              }
              style={styles.image}
              resizeMode="contain"
            />
          </TouchableOpacity>

          {start || stop ? (
            <TouchableOpacity
              style={styles.stopButtonStyle}
              onPress={stop ? resetRoute : stopRoute}
            >
              <Image
                source={
                  stop
                    ? require("./icons/trashcan.png")
                    : require("./icons/stop.png")
                }
                style={styles.image}
                resizeMode="contain"
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  map: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
  },
  background: {
    width: "100%",
    height: "100%",
  },
  startButtonStyle: {
    height: "40%",
    width: "100%",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#C2F784",
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "white",
  },
  stopButtonStyle: {
    height: "40%",
    width: "100%%",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFBBBB",
    borderWidth: 2,
    borderColor: "white",
  },
  summaryButton: {
    height: "37%",
    width: "50%",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#BFFFF0",
    borderWidth: 2,
    borderColor: "white",
    marginBottom: 20,
    left: "14%",
  },
  infoContainer: {
    width: "100%",
    height: "15%",
    top: 0,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    position: "absolute",
    backgroundColor: "#BFFFF0",
    borderBottomWidth: 2,
    borderColor: "black",
  },
  buttonContainer: {
    height: "22%",
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
    flexDirection: "row",
    position: "absolute",
  },
  rightButtonContainer: {
    height: "100%",
    width: "20%",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  leftButtonContainer: {
    height: "100%",
    width: "80%",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  modalView: {
    width: "80%",
    height: "45%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ECFCFF",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#3E64FF",
    padding: 10,
  },
  topModal: {
    height: "20%",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  middleModal: {
    height: "60%",
    width: "100%",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  bottomModal: {
    height: "20%",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  modalButton: {
    height: "70%",
    width: "50%",
    backgroundColor: "#3E64FF",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#5EDFFF",
  },
  image: {
    height: "100%",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    width: "33%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  buttonText: {
    color: "#5463FF",
    fontWeight: "bold",
  },
  modalText: {
    color: "#170055",
    fontSize: 20,
  },
  modalButtonText: {
    color: "#B2FCFF",
    fontWeight: "bold",
    fontSize: 20,
  },
});
