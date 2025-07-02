import * as FileSystem from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export class DocumentStorageService {
  constructor() {
    this.db = null;
    this.documentsDir = FileSystem.documentDirectory + 'scanned_documents/';
    this.thumbnailsDir = FileSystem.documentDirectory + 'thumbnails/';
    this.dbVersion = 2; // Increment this when you make schema changes
  }

  async initialize() {
    try {
      await this.createDirectories();
      console.log('Opening database...');
      
      // Use the synchronous method for opening database
      this.db = SQLite.openDatabaseSync('documents.db');
      
      if (!this.db) {
        throw new Error('Database failed to initialize');
      }
      
      console.log('Database opened successfully');
      await this.createTables();
      await this.runMigrations();
      console.log('Document storage service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize storage service:', error);
      throw new Error(`Storage initialization failed: ${error.message}`);
    }
  }

  async createDirectories() {
    try {
      console.log('Creating directories...');
      
      const dirInfo = await FileSystem.getInfoAsync(this.documentsDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.documentsDir, { intermediates: true });
        console.log('Documents directory created');
      }
      
      const thumbInfo = await FileSystem.getInfoAsync(this.thumbnailsDir);
      if (!thumbInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.thumbnailsDir, { intermediates: true });
        console.log('Thumbnails directory created');
      }
    } catch (error) {
      console.error('Error creating directories:', error);
      throw error;
    }
  }

  async createTables() {
    try {
      console.log('Creating database tables...');
      
      if (!this.db) {
        throw new Error('Database not initialized before creating tables');
      }

      // Create version table to track database schema version
      const createVersionTable = `
        CREATE TABLE IF NOT EXISTS db_version (
          version INTEGER PRIMARY KEY
        );
      `;

      // Create folders table
      const createFoldersTable = `
        CREATE TABLE IF NOT EXISTS folders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          parent_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (parent_id) REFERENCES folders (id) ON DELETE CASCADE
        );
      `;

      // Create documents table (without folder_id initially for migration compatibility)
      const createDocumentsTable = `
        CREATE TABLE IF NOT EXISTS documents (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          file_path TEXT NOT NULL,
          thumbnail_path TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          file_size INTEGER,
          page_count INTEGER DEFAULT 1,
          category TEXT DEFAULT 'general',
          tags TEXT,
          ocr_text TEXT
        );
      `;

      // Use synchronous exec method
      this.db.execSync(createVersionTable);
      this.db.execSync(createFoldersTable);
      this.db.execSync(createDocumentsTable);
      
      console.log('Database tables created successfully');
      
    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  }

  async runMigrations() {
    try {
      console.log('Checking database migrations...');
      
      // Get current database version
      let currentVersion = 0;
      try {
        const versionResult = this.db.getFirstSync('SELECT version FROM db_version ORDER BY version DESC LIMIT 1');
        currentVersion = versionResult?.version || 0;
      } catch (error) {
        // If db_version table doesn't exist or is empty, assume version 0
        console.log('No version found, assuming version 0');
      }

      console.log(`Current database version: ${currentVersion}, target version: ${this.dbVersion}`);

      // Run migrations based on version
      if (currentVersion < 1) {
        console.log('Running migration to version 1...');
        // Migration 1: Add folder_id column to documents table
        await this.addFolderIdColumn();
        await this.updateDatabaseVersion(1);
      }

      if (currentVersion < 2) {
        console.log('Running migration to version 2...');
        // Add any future migrations here
        await this.updateDatabaseVersion(2);
      }

      console.log('Database migrations completed successfully');
    } catch (error) {
      console.error('Error running migrations:', error);
      throw error;
    }
  }

  async addFolderIdColumn() {
    try {
      // Check if folder_id column already exists
      const tableInfo = this.db.getAllSync("PRAGMA table_info(documents)");
      const hasFolder = tableInfo.some(column => column.name === 'folder_id');
      
      if (!hasFolder) {
        console.log('Adding folder_id column to documents table...');
        this.db.execSync(`
          ALTER TABLE documents 
          ADD COLUMN folder_id INTEGER REFERENCES folders(id) ON DELETE SET NULL
        `);
        console.log('folder_id column added successfully');
      } else {
        console.log('folder_id column already exists');
      }
    } catch (error) {
      console.error('Error adding folder_id column:', error);
      throw error;
    }
  }

  async updateDatabaseVersion(version) {
    try {
      this.db.runSync('INSERT OR REPLACE INTO db_version (version) VALUES (?)', [version]);
      console.log(`Database version updated to ${version}`);
    } catch (error) {
      console.error('Error updating database version:', error);
      throw error;
    }
  }

  // FOLDER OPERATIONS
  async createFolder(name, parentId = null) {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      const result = this.db.runSync(
        'INSERT INTO folders (name, parent_id) VALUES (?, ?)',
        [name, parentId]
      );

      return {
        id: result.lastInsertRowId,
        name,
        parent_id: parentId,
        created_at: new Date().toISOString(),
        type: 'folder'
      };
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  }

  async renameFolder(id, newName) {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      this.db.runSync(
        'UPDATE folders SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newName, id]
      );

      return true;
    } catch (error) {
      console.error('Error renaming folder:', error);
      throw error;
    }
  }

  async deleteFolder(id) {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      // Get all documents in this folder
      const documents = this.db.getAllSync(
        'SELECT * FROM documents WHERE folder_id = ?',
        [id]
      );

      // Delete physical files
      for (const doc of documents) {
        await FileSystem.deleteAsync(doc.file_path, { idempotent: true });
        if (doc.thumbnail_path) {
          await FileSystem.deleteAsync(doc.thumbnail_path, { idempotent: true });
        }
      }

      // Delete folder and its contents (CASCADE will handle documents)
      this.db.runSync('DELETE FROM folders WHERE id = ?', [id]);
      
      return true;
    } catch (error) {
      console.error('Error deleting folder:', error);
      throw error;
    }
  }

  async getFolders(parentId = null) {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      let folders;
      if (parentId === null) {
        folders = this.db.getAllSync(
          'SELECT * FROM folders WHERE parent_id IS NULL ORDER BY name ASC'
        );
      } else {
        folders = this.db.getAllSync(
          'SELECT * FROM folders WHERE parent_id = ? ORDER BY name ASC',
          [parentId]
        );
      }

      return folders.map(folder => ({
        ...folder,
        type: 'folder'
      }));
    } catch (error) {
      console.error('Error getting folders:', error);
      throw error;
    }
  }

  // DOCUMENT OPERATIONS
  async saveDocument(imageUri, title = null, category = 'general', folderId = null) {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      const timestamp = new Date().getTime();
      const fileName = `doc_${timestamp}.jpg`;
      const thumbnailName = `thumb_${timestamp}.jpg`;
      
      const filePath = this.documentsDir + fileName;
      const thumbnailPath = this.thumbnailsDir + thumbnailName;

      const processedImage = await this.processDocumentImage(imageUri);
      await FileSystem.moveAsync({
        from: processedImage.uri,
        to: filePath,
      });

      const thumbnail = await this.createThumbnail(filePath);
      await FileSystem.moveAsync({
        from: thumbnail.uri,
        to: thumbnailPath,
      });

      const fileInfo = await FileSystem.getInfoAsync(filePath);
      
      const result = this.db.runSync(
        'INSERT INTO documents (title, file_path, thumbnail_path, file_size, category, folder_id) VALUES (?, ?, ?, ?, ?, ?)',
        [
          title || `Document ${new Date().toLocaleDateString()}`,
          filePath,
          thumbnailPath,
          fileInfo.size,
          category,
          folderId
        ]
      );

      return {
        id: result.lastInsertRowId,
        title: title || `Document ${new Date().toLocaleDateString()}`,
        filePath,
        thumbnailPath,
        createdAt: new Date().toISOString(),
        folder_id: folderId,
        type: 'document'
      };
    } catch (error) {
      console.error('Error saving document:', error);
      throw error;
    }
  }

  async moveDocumentToFolder(documentId, folderId) {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      this.db.runSync(
        'UPDATE documents SET folder_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [folderId, documentId]
      );

      return true;
    } catch (error) {
      console.error('Error moving document to folder:', error);
      throw error;
    }
  }

  async getDocumentsInFolder(folderId = null) {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      let documents;
      if (folderId === null) {
        documents = this.db.getAllSync(
          'SELECT * FROM documents WHERE folder_id IS NULL ORDER BY created_at DESC'
        );
      } else {
        documents = this.db.getAllSync(
          'SELECT * FROM documents WHERE folder_id = ? ORDER BY created_at DESC',
          [folderId]
        );
      }

      return documents.map(doc => ({
        ...doc,
        type: 'document'
      }));
    } catch (error) {
      console.error('Error getting documents in folder:', error);
      throw error;
    }
  }

  async getAllItems(folderId = null) {
    try {
      const folders = await this.getFolders(folderId);
      const documents = await this.getDocumentsInFolder(folderId);
      
      return [...folders, ...documents];
    } catch (error) {
      console.error('Error getting all items:', error);
      throw error;
    }
  }

  async searchItems(query) {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }

      const folders = this.db.getAllSync(
        'SELECT *, "folder" as type FROM folders WHERE name LIKE ?',
        [`%${query}%`]
      );

      const documents = this.db.getAllSync(
        'SELECT *, "document" as type FROM documents WHERE title LIKE ?',
        [`%${query}%`]
      );

      return [...folders, ...documents];
    } catch (error) {
      console.error('Error searching items:', error);
      throw error;
    }
  }

  // EXISTING METHODS (updated to work with folders)
  async processDocumentImage(imageUri) {
    return await manipulateAsync(
      imageUri,
      [{ resize: { width: 1200 } }],
      {
        compress: 0.9,
        format: SaveFormat.JPEG,
        base64: false,
      }
    );
  }

  async createThumbnail(filePath) {
    return await manipulateAsync(
      filePath,
      [{ resize: { width: 200, height: 300 } }],
      {
        compress: 0.7,
        format: SaveFormat.JPEG,
        base64: false,
      }
    );
  }

  async getAllDocuments() {
    const result = this.db.getAllSync(
      'SELECT * FROM documents ORDER BY created_at DESC'
    );
    return result;
  }

  async deleteDocument(id) {
    try {
      const doc = this.db.getFirstSync(
        'SELECT file_path, thumbnail_path FROM documents WHERE id = ?',
        [id]
      );

      if (doc) {
        await FileSystem.deleteAsync(doc.file_path, { idempotent: true });
        if (doc.thumbnail_path) {
          await FileSystem.deleteAsync(doc.thumbnail_path, { idempotent: true });
        }
        this.db.runSync('DELETE FROM documents WHERE id = ?', [id]);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }

  async getStorageStats() {
    const docs = await this.getAllDocuments();
    const totalSize = docs.reduce((acc, doc) => acc + (doc.file_size || 0), 0);
    
    return {
      documentCount: docs.length,
      totalSize: totalSize,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
    };
  }

  async getDocumentById(id) {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }
      
      const result = this.db.getFirstSync(
        'SELECT * FROM documents WHERE id = ?',
        [id]
      );
      
      if (!result) {
        throw new Error('Document not found');
      }
      
      return result;
    } catch (error) {
      console.error('Error getting document by ID:', error);
      throw error;
    }
  }

  async updateDocument(id, updates) {
    try {
      if (!this.db) {
        throw new Error('Database not initialized');
      }
      
      const { title, category, tags } = updates;
      
      this.db.runSync(
        'UPDATE documents SET title = ?, category = ?, tags = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [title, category, tags || null, id]
      );
      
      return true;
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  }
}
