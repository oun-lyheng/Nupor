const db = require("../../models");
const { addresses } = db;

// GET ALL ADDRESSES FOR A USER
const getAddresses = async ({ userId }) => {
  const userAddresses = await addresses.findAll({
    where: { userId },
    order: [
      ["isDefault", "DESC"],
      ["createdAt", "DESC"],
    ],
  });

  return {
    message: "Addresses fetched successfully",
    data: userAddresses,
  };
};

// ADD NEW ADDRESS
const addAddress = async ({
  userId,
  label = "Home",
  receiverName,
  phoneNumber,
  streetAddress,
  city = "Phnom Penh",
  isDefault = false,
}) => {
  if (!receiverName || !phoneNumber || !streetAddress) {
    const error = new Error("receiverName, phoneNumber, and streetAddress are required");
    error.status = 400;
    throw error;
  }

  // Check how many addresses user already has
  const count = await addresses.count({ where: { userId } });

  // If first address or isDefault is requested, make it default
  const shouldBeDefault = count === 0 ? true : Boolean(isDefault);

  if (shouldBeDefault) {
    await addresses.update(
      { isDefault: false },
      { where: { userId } }
    );
  }

  const newAddress = await addresses.create({
    userId,
    label,
    receiverName,
    phoneNumber,
    streetAddress,
    city,
    isDefault: shouldBeDefault,
  });

  return {
    message: "Address added successfully",
    data: newAddress,
  };
};

// UPDATE ADDRESS
const updateAddress = async ({
  userId,
  addressId,
  label,
  receiverName,
  phoneNumber,
  streetAddress,
  city,
  isDefault,
}) => {
  const address = await addresses.findOne({
    where: { id: addressId, userId },
  });

  if (!address) {
    const error = new Error("Address not found");
    error.status = 404;
    throw error;
  }

  if (isDefault === true) {
    await addresses.update(
      { isDefault: false },
      { where: { userId } }
    );
  }

  const updatePayload = {};
  if (label !== undefined) updatePayload.label = label;
  if (receiverName !== undefined) updatePayload.receiverName = receiverName;
  if (phoneNumber !== undefined) updatePayload.phoneNumber = phoneNumber;
  if (streetAddress !== undefined) updatePayload.streetAddress = streetAddress;
  if (city !== undefined) updatePayload.city = city;
  if (isDefault !== undefined) updatePayload.isDefault = Boolean(isDefault);

  await address.update(updatePayload);

  return {
    message: "Address updated successfully",
    data: address,
  };
};

// SET DEFAULT ADDRESS
const setDefaultAddress = async ({ userId, addressId }) => {
  const address = await addresses.findOne({
    where: { id: addressId, userId },
  });

  if (!address) {
    const error = new Error("Address not found");
    error.status = 404;
    throw error;
  }

  await addresses.update(
    { isDefault: false },
    { where: { userId } }
  );

  await address.update({ isDefault: true });

  return {
    message: "Default address updated successfully",
    data: address,
  };
};

// DELETE ADDRESS
const deleteAddress = async ({ userId, addressId }) => {
  const address = await addresses.findOne({
    where: { id: addressId, userId },
  });

  if (!address) {
    const error = new Error("Address not found");
    error.status = 404;
    throw error;
  }

  const wasDefault = address.isDefault;
  await address.destroy();

  // If the deleted address was default, promote the newest remaining address
  if (wasDefault) {
    const remaining = await addresses.findOne({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });

    if (remaining) {
      await remaining.update({ isDefault: true });
    }
  }

  return {
    message: "Address deleted successfully",
    data: null,
  };
};

module.exports = {
  getAddresses,
  addAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
};
