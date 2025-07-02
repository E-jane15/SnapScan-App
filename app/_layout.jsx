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
      
     }}
  >
    <Stack.Screen name='splashscreen' options={{headerShown: false}}/>
    <Stack.Screen name='welcomescreen' options={{headerShown: false}}/>
    <Stack.Screen name='index' options={{headerShown: false}}/>
    <Stack.Screen name='scanscreen/index' options={{
    headerShown: false, contentStyle: { padding: 0, backgroundColor: '#000' }, 
  }} />
    <Stack.Screen name='documentviewer/index' options={{
    headerShown: false, contentStyle: { padding: 0, backgroundColor: '#000' }, 
  }}/>
    <Stack.Screen name='preview' options={{
    headerShown: false, contentStyle: { padding: 0, backgroundColor: '#000' }, 
  }}/>
  </Stack>
    
};

export default RootLayout;