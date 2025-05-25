import { Text, View, StyleSheet, TextInput,Image, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons"
import { useRouter } from "expo-router";

const HomeScreen =() => {

  const router = useRouter();

  return (
    <View style={styles.container}>

      <View style={styles.searchBar}>
        <Ionicons name='search' size={15} color='#b2b6b8'/>
         <TextInput placeholder="Search"/>
      </View>
      
      <Text style={styles.titleText}>Scanned Files</Text>
      
      <Image source={require('../assets/images/note-icon.png')} style={styles.image}/>
      <Text style={styles.imageTitle}>No scanned file</Text>

      <View style={styles.button}>
          <TouchableOpacity
            onPress={() => router.push('/cameraScreen')}
          >
            <Ionicons name="camera" size={29} color='#ffff'/>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => router.push('/createfolder')}
          >
              <Ionicons name="folder" size={26} color='#ffff'/>
          </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container:{
     flex: 1,
    // justifyContent: "center",
     //alignItems: "center",
  },
  searchBar:{
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F1F1',
    borderRadius: 25,
    paddingHorizontal: 20,
    height: 40,
    marginBottom: 16,
  },
  titleText:{
    fontSize: 19,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  image:{
    width:150,
    height:150, 
    //justifyContent: 'center',
    //alignItems: 'center',
     marginTop: 70,
     marginBottom: 10,
     alignSelf: 'center',
  },
  imageTitle:{
    textAlign: 'center',
    fontSize: 17,
    color: '#b2b6b8',
  },
  button:{
     flexDirection: 'row',
     backgroundColor: '#FFA629',
     paddingHorizontal: 15,
     paddingVertical:8,
     borderRadius: 25,
     alignItems: 'center',
     justifyContent: 'space-between',
     marginTop: 100,
     width: 100,
     left: 220,
  }
})

export default HomeScreen;