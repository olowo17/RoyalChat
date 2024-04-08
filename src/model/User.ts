import mongoose, { Schema, Document, model } from "mongoose";
import bcrypt from 'bcrypt';
import Post from "./Post";

export interface IUser extends Document {
    username: string;
    password: string; 
    email: string;
    avatar?: string;
    isVerified?: boolean;
    posts?: Array<object>;
  }

const UserSchema: Schema = new Schema(
    {
        username: {
            type: String,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                'Please add a valid email'
              ]
        },
        password: {
            type: String,
            required: [true, 'Please add a password of min 6 characters'],
            minlength: 6,
        },
        avatar: {
            type: String,
            default: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQdGr3fTJlsjdAEiSCDznslzUJXqeI22hIB20aDOvQsf9Hz93yoOiLaxnlPEA&s',
        },
        posts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
        following: [
            {
                type: Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        isVerified:
        {
            type: Boolean,
            default: false,
        },
    },

    { collection: 'users', timestamps: true }
);

UserSchema.methods.matchPassword = async function (enteredPassword: string) {
    return await bcrypt.compare(enteredPassword, this.password);
};


const User = model<IUser>('User', UserSchema);
export default User;
