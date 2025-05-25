import { Stack } from "expo-router";

const RootLayout = () => {
  return <Stack 
     screenOptions={{
      headerStyle:{
        backgroundColor: '#FFA629',
      },
      headerTintColor: '#fff',
      headerTitleStyle:{
        fontSize: 20,
        fontWeight: 'bold',
      }, 
      contentStyle:{
        paddingHorizontal:15,
        paddingTop:15,
        backgroundColor: '#fff',
        fontSize:18,
      },
     }}
  >
    <Stack.Screen name='index' options={{title: 'Home'}}/>
  </Stack>
    
};

export default RootLayout;