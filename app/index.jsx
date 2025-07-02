import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  RefreshControl,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  TextInput,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { DocumentStorageService } from '../utils/datastorage';

const { width } = Dimensions.get('window');

const DocumentsListScreen = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [storageStats, setStorageStats] = useState(null);
  const [storageService, setStorageService] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [currentFolder, setCurrentFolder] = useState(null);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [availableFolders, setAvailableFolders] = useState([]);
 
  const router = useRouter();

  // Initialize storage service
  useEffect(() => {
    const initializeStorage = async () => {
      try {
        console.log('Initializing storage service...');
        const service = new DocumentStorageService();
        await service.initialize();
        setStorageService(service);
        setIsInitialized(true);
        console.log('Storage service initialized successfully');
      } catch (error) {
        console.error('Failed to initialize storage service:', error);
        Alert.alert(
          'Initialization Error', 
          'Failed to initialize document storage. Please restart the app.',
          [{ text: 'OK' }]
        );
        setLoading(false);
      }
    };

    initializeStorage();
  }, []);

  // Load items when screen focuses
  useFocusEffect(
    useCallback(() => {
      if (isInitialized && storageService) {
        loadItems();
      }
    }, [isInitialized, storageService, currentFolder, searchQuery, activeTab])
  );

  const loadItems = async () => {
    if (!storageService) {
      console.log('Storage service not ready yet');
      return;
    }

    try {
      console.log('Loading items...');
      let loadedItems = [];

      if (searchQuery) {
        loadedItems = await storageService.searchItems(searchQuery);
      } else {
        loadedItems = await storageService.getAllItems(currentFolder);
      }

      // Filter by active tab
      if (activeTab === 'Folders') {
        loadedItems = loadedItems.filter(item => item.type === 'folder');
      } else if (activeTab === 'Files') {
        loadedItems = loadedItems.filter(item => item.type === 'document');
      }

      const stats = await storageService.getStorageStats();
      
      console.log('Loaded items:', loadedItems?.length || 0);
      setItems(loadedItems || []);
      setStorageStats(stats);
    } catch (error) {
      console.error('Error loading items:', error);
      Alert.alert('Error', `Failed to load items: ${error.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    if (!storageService) return;
    setRefreshing(true);
    loadItems();
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      Alert.alert('Error', 'Please enter a folder name');
      return;
    }

    try {
      await storageService.createFolder(newFolderName.trim(), currentFolder);
      setNewFolderName('');
      setShowCreateFolderModal(false);
      loadItems();
    } catch (error) {
      Alert.alert('Error', 'Failed to create folder');
    }
  };

  const handleItemPress = (item) => {
    if (item.type === 'folder') {
      // Navigate into folder
      setBreadcrumb([...breadcrumb, { id: item.id, name: item.name }]);
      setCurrentFolder(item.id);
    } else {
      // View document
      router.push(`/documentviewer?documentId=${item.id}`);
    }
  };

  const handleItemLongPress = (item) => {
    setSelectedItem(item);
    setShowOptionsModal(true);
  };

  const handleRename = () => {
    Alert.prompt(
      'Rename',
      `Enter new name for "${selectedItem.name || selectedItem.title}":`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Rename',
          onPress: async (newName) => {
            if (!newName?.trim()) return;
            
            try {
              if (selectedItem.type === 'folder') {
                await storageService.renameFolder(selectedItem.id, newName.trim());
              } else {
                await storageService.updateDocument(selectedItem.id, { 
                  title: newName.trim(),
                  category: selectedItem.category,
                  tags: selectedItem.tags
                });
              }
              loadItems();
            } catch (error) {
              Alert.alert('Error', 'Failed to rename item');
            }
          },
        },
      ],
      'plain-text',
      selectedItem.name || selectedItem.title
    );
    setShowOptionsModal(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${selectedItem.name || selectedItem.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (selectedItem.type === 'folder') {
                await storageService.deleteFolder(selectedItem.id);
              } else {
                await storageService.deleteDocument(selectedItem.id);
              }
              loadItems();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ]
    );
    setShowOptionsModal(false);
  };

  const handleMove = async () => {
    try {
      const folders = await storageService.getFolders();
      setAvailableFolders([{ id: null, name: 'Root' }, ...folders]);
      setShowMoveModal(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to load folders');
    }
    setShowOptionsModal(false);
  };

  const handleMoveToFolder = async (folderId) => {
    try {
      if (selectedItem.type === 'document') {
        await storageService.moveDocumentToFolder(selectedItem.id, folderId);
        loadItems();
      }
      setShowMoveModal(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to move item');
    }
  };

  const navigateUp = () => {
    if (breadcrumb.length > 0) {
      const newBreadcrumb = [...breadcrumb];
      newBreadcrumb.pop();
      setBreadcrumb(newBreadcrumb);
      setCurrentFolder(newBreadcrumb.length > 0 ? newBreadcrumb[newBreadcrumb.length - 1].id : null);
    }
  };

  const getItemIcon = (item) => {
    if (item.type === 'folder') {
      return 'folder';
    } else {
      // Determine file type based on category or title
      if (item.title?.toLowerCase().includes('receipt') || item.category === 'receipt') {
        return 'document-text';
      } else if (item.title?.toLowerCase().includes('note') || item.category === 'note') {
        return 'document-text';
      } else {
        return 'document';
      }
    }
  };

  const getItemColor = (item) => {
    if (item.type === 'folder') {
      return '#FFB800'; // Orange for folders
    } else {
      return '#FF4444'; // Red for PDF-like documents
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.itemRow}
      onPress={() => handleItemPress(item)}
      onLongPress={() => handleItemLongPress(item)}
    >
      <View style={styles.itemIcon}>
        <Ionicons 
          name={getItemIcon(item)} 
          size={24} 
          color={getItemColor(item)} 
        />
      </View>
      
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {item.name || item.title}
        </Text>
        {item.type === 'document' && (
          <Text style={styles.itemSubtitle}>
            {formatFileSize(item.file_size)}
          </Text>
        )}
      </View>
      
      {item.type === 'folder' && (
        <Ionicons name="chevron-forward" size={16} color="#999" />
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="folder-open-outline" size={80} color="#999" />
      <Text style={styles.emptyTitle}>No items here</Text>
      <Text style={styles.emptySubtitle}>
        Create a folder or scan a document to get started
      </Text>
    </View>
  );

  if (loading || !isInitialized) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>
          {!isInitialized ? 'Initializing...' : 'Loading...'}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title or folder name"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabContainer}>
        {['All', 'Folders', 'Files'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Breadcrumb */}
      {breadcrumb.length > 0 && (
        <View style={styles.breadcrumbContainer}>
          <TouchableOpacity onPress={navigateUp} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.breadcrumbText}>
            {breadcrumb.map(item => item.name).join(' > ')}
          </Text>
        </View>
      )}

      {/* Items List */}
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('./scanscreen')}
        >
          <Ionicons name="camera" size={24} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.fab, styles.fabSecondary]}
          onPress={() => setShowCreateFolderModal(true)}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Create Folder Modal */}
      <Modal
        visible={showCreateFolderModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Folder</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter folder name"
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus={true}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowCreateFolderModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={handleCreateFolder}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonPrimaryText]}>
                  Create
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Options Modal */}
      <Modal
        visible={showOptionsModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.optionsModal}>
            <Text style={styles.optionsTitle}>
              {selectedItem?.name || selectedItem?.title}
            </Text>
            
            <TouchableOpacity style={styles.optionItem} onPress={handleRename}>
              <Ionicons name="create-outline" size={20} color="#007AFF" />
              <Text style={styles.optionText}>Rename</Text>
            </TouchableOpacity>
            
            {selectedItem?.type === 'document' && (
              <TouchableOpacity style={styles.optionItem} onPress={handleMove}>
                <Ionicons name="move-outline" size={20} color="#007AFF" />
                <Text style={styles.optionText}>Move to Folder</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.optionItem} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              <Text style={[styles.optionText, styles.deleteText]}>Delete</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.cancelOption}
              onPress={() => setShowOptionsModal(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Move Modal */}
      <Modal
        visible={showMoveModal}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Move to Folder</Text>
            <FlatList
              data={availableFolders}
              keyExtractor={(item) => item.id?.toString() || 'root'}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.folderOption}
                  onPress={() => handleMoveToFolder(item.id)}
                >
                  <Ionicons name="folder" size={20} color="#FFB800" />
                  <Text style={styles.folderOptionText}>{item.name}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowMoveModal(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    color: '#666',
    fontSize: 16,
    marginTop: 12,
  },
  
  // Search Bar
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 40,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#000',
  },
  
  // Filter Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: 'white',
  },
  
  // Breadcrumb
  breadcrumbContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    marginRight: 12,
  },
  breadcrumbText: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  
  // Items List
  listContainer: {
    paddingTop: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  itemIcon: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#000',
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
  
  // Floating Action Buttons
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    flexDirection: 'column',
    alignItems: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginBottom: 12,
  },
  fabSecondary: {
    backgroundColor: '#34C759',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: width - 40,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#F2F2F7',
  },
  modalButtonPrimary: {
    backgroundColor: '#007AFF',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
    textAlign: 'center',
  },
  modalButtonPrimaryText: {
    color: 'white',
  },
  
  // Options Modal
  optionsModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 0,
    width: width - 40,
    maxWidth: 300,
    overflow: 'hidden',
  },
  optionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
    textAlign: 'center',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  optionText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 12,
  },
  deleteText: {
    color: '#FF3B30',
  },
  cancelOption: {
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  
  // Move Modal
  folderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  folderOptionText: {
    fontSize: 16,
    color: '#000',
    marginLeft: 12,
  },
});

export default DocumentsListScreen;


{/*import { Text, View, StyleSheet, TextInput,Image, TouchableOpacity } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons"
import FileDetails from "../components/FileDetails";
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
      <FileDetails></FileDetails>
      
      /*<Image source={require('../assets/images/note-icon.png')} style={styles.image}/>
      <Text style={styles.imageTitle}>No scanned file</Text>

      <View style={styles.button}>
          <TouchableOpacity
            onPress={() => router.push('/scanscreen')}
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
     position: 'absolute',
     bottom: 200,
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

  export default HomeScreen; */}