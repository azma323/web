import { Client, Databases, Account, Storage } from 'appwrite';

const client = new Client()
    .setEndpoint('https://sgp.cloud.appwrite.io/v1') 
    .setProject('bdtplatform001');                  

export const databases = new Databases(client);
export const account = new Account(client);

// 🔴 এই লাইনটিই আপনার কোডে মিসিং ছিল
export const storage = new Storage(client); 

export const DATABASE_ID = '69b9af2c0033ac0bf9c8'; 
export const PRODUCT_COLLECTION_ID = 'products'; 
export const CATEGORY_COLLECTION_ID = 'categories'; 

// 🔴 Appwrite Storage থেকে আপনার তৈরি করা Bucket ID এখানে বসান
export const BUCKET_ID = '69bba01d0015ceea75de';
export const REQUEST_COLLECTION_ID = 'requests'; // নতুন যোগ করা হলো
