import BusinessType from "./business-type.model.js";

const getActiveBusinessTypes = async (req, res) => {
  try {
    // Registration can only select active platform-managed business types.
    const businessTypes = await BusinessType.find({ isActive: true })
      .select("code name iconName resourceTypes")
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({
      businessTypes: businessTypes.map((businessType) => ({
        id: businessType._id,
        code: businessType.code,
        name: businessType.name,
        iconName: businessType.iconName,
        resourceTypes: businessType.resourceTypes.filter((resourceType) => resourceType.isActive),
      })),
    });
  } catch (error) {
    console.error("Failed to load business types:", error);
    return res.status(500).json({ message: "Unable to load business types" });
  }
};

export { getActiveBusinessTypes };
