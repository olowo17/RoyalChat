import mongoose, { Schema, Document, model } from "mongoose";
import bcrypt from 'bcryptjs';
import Post from "./Post";

export interface IUser extends Document {
    username: string;
    password: string;
    email: string;
    avatar?: string;
    matchPassword: (enteredPassword: string) => Promise<boolean>;
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
        },
        password: {
            type: String,
            required: [true, 'Please add a password of min 6 characters'],
            minlength: 6,
            select: false
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

UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = bcrypt.hash(this.password.toString(), salt);
    next();
});

const User = model<IUser>('User', UserSchema);
export default User;
