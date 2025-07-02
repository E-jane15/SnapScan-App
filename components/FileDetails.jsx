import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import React from 'react'

const FileDetails = () => {
  return (
    <View style = {styles.fileContainer}>
       <Ionicons name='document' size={26}/>
       <View style={styles.fileInfo}>
           <Text style={styles.fileName}>File Name</Text>
          <Text style={styles.fileDate}>29/05/2025</Text>
       </View>
       
      <Ionicons name='ellipsis-vertical-outline' size={20}/>
    </View>
  )
}
 const styles = StyleSheet.create({
  fileContainer:{
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    boxShadow: '2px 1px 4px rgba(0,0,0,0.1)',
    borderRadius: 4,
    paddingHorizontal: 10,
    marginVertical: 5,
    backgroundColor: '#fbfbf9',
    
  }
  ,
  fileInfo:{
    flex: 1,
    marginLeft: 30,
  },
  fileName:{
    fontWeight: 'bold',
    fontSize: 15,
  }
 })

export default FileDetails