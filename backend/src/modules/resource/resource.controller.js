import Business from "../business/business.model.js";
import BusinessType from "../business/business-type.model.js";
import User from "../users/user.model.js";
import Resource from "./resource.model.js";
import {
  ResourceValidationError,
  validateResourceCreation,
} from "./resource.validation.js";

const getResources = async (req, res) => {
  try {
    // Every resource list is limited to the authenticated user's business.
    const resources = await Resource.find({ businessId: req.user.businessId })
      .select("name resourceType isActive linkedUserId createdAt updatedAt")
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({ resources });
  } catch (error) {
    console.error("Failed to load resources:", error);
    return res.status(500).json({ message: "Unable to load resources" });
  }
};

const createResource = async (req, res) => {
  try {
    const { name, resourceType, linkedUserId } = validateResourceCreation(req.body);
    // Select only the needed field and return a lightweight read-only object with .lean().
    const business = await Business.findById(req.user.businessId).select("businessTypeId").lean();

    if (!business) {
      return res.status(401).json({ message: "Unauthorized: Please login" });
    }

    // Resource types must be active in the authenticated business's platform configuration.
    const allowedResourceType = await BusinessType.exists({
      _id: business.businessTypeId,
      isActive: true,
      resourceTypes: { $elemMatch: { code: resourceType, isActive: true } },
    });

    if (!allowedResourceType) {
      return res.status(400).json({ message: "Invalid resource type" });
    }

    if (linkedUserId) {
      const linkedUser = await User.exists({
        _id: linkedUserId,
        businessId: req.user.businessId,
      });

      if (!linkedUser) {
        return res.status(400).json({ message: "Invalid linked user" });
      }
    }

    // The API, not the client, assigns the tenant identity.
    const resource = await Resource.create({
      businessId: req.user.businessId,
      name,
      resourceType,
      linkedUserId,
    });

    return res.status(201).json({
      message: "Resource created successfully",
    });
  } catch (error) {
    if (error instanceof ResourceValidationError) {
      return res.status(400).json({ message: error.message });
    }

    console.error("Resource creation failed:", error);
    return res.status(500).json({ message: "Unable to create resource" });
  }
};

export { createResource, getResources };
