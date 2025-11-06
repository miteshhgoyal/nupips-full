import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipcode: { type: String, required: true },
    country: { type: String, default: "India" },
    phone: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
    label: { type: String, default: "Home" } // Home, Work, Other
});

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, default: "" },
    cartData: { type: Object, default: {} },
    addresses: [addressSchema],
    profile: {
        firstName: { type: String, default: "" },
        lastName: { type: String, default: "" },
        phone: { type: String, default: "" },
        dateOfBirth: { type: Date },
        gender: { type: String, enum: ['male', 'female', 'other'], default: 'other' }
    }
}, { minimize: false, timestamps: true });

const userModel = mongoose.models.user || mongoose.model('user', userSchema);

export default userModel;
