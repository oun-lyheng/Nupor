const {
  getAddresses,
  addAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
} = require("./Address.service");

// GET ALL USER ADDRESSES
const getAddressesController = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await getAddresses({ userId });

    return res.status(200).json({
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      message: error.message,
    });
  }
};

// ADD NEW ADDRESS
const addAddressController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { label, receiverName, phoneNumber, streetAddress, city, isDefault } = req.body;

    const result = await addAddress({
      userId,
      label,
      receiverName,
      phoneNumber,
      streetAddress,
      city,
      isDefault,
    });

    return res.status(201).json({
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      message: error.message,
    });
  }
};

// UPDATE ADDRESS
const updateAddressController = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.id;
    const { label, receiverName, phoneNumber, streetAddress, city, isDefault } = req.body;

    const result = await updateAddress({
      userId,
      addressId,
      label,
      receiverName,
      phoneNumber,
      streetAddress,
      city,
      isDefault,
    });

    return res.status(200).json({
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      message: error.message,
    });
  }
};

// SET DEFAULT ADDRESS
const setDefaultAddressController = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.id;

    const result = await setDefaultAddress({ userId, addressId });

    return res.status(200).json({
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      message: error.message,
    });
  }
};

// DELETE ADDRESS
const deleteAddressController = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.id;

    const result = await deleteAddress({ userId, addressId });

    return res.status(200).json({
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    const statusCode = error.status || 500;
    return res.status(statusCode).json({
      message: error.message,
    });
  }
};

module.exports = {
  getAddressesController,
  addAddressController,
  updateAddressController,
  setDefaultAddressController,
  deleteAddressController,
};
