import mongoose from "mongoose";
import Service from "./service.model.js";
import { tenantData, tenantFilter } from "../../utils/tenant-scope.js";
import {
  ServiceValidationError,
  validateServiceCreation,
  validateServiceListQuery,
  validateServiceUpdate,
} from "./service.validation.js";

const toPublicService = (service) => ({
  _id: service._id,
  name: service.name,
  pricePaise: service.pricePaise,
  durationMinutes: service.durationMinutes,
  isActive: service.isActive,
  createdAt: service.createdAt,
  updatedAt: service.updatedAt,
});

const getServices = async (req, res) => {
  try {
    const listFilter = validateServiceListQuery(req.query);
    // Every service list is constrained to the authenticated business.
    const services = await Service.find(tenantFilter(req, listFilter))
      .select("name pricePaise durationMinutes isActive createdAt updatedAt")
      .sort({ name: 1 })
      .lean();
    return res.status(200).json({ services: services.map(toPublicService) });
  } catch (error) {
    if (error instanceof ServiceValidationError) {
      return res.status(400).json({ message: error.message });
    }
    console.error("Failed to load services:", error);
    return res.status(500).json({ message: "Unable to load services" });
  }
};

const getServiceOptions = async (req, res) => {
  try {
    // Booking forms may choose only active services from the authenticated business.
    const services = await Service.find(tenantFilter(req, { isActive: true }))
      .select("name pricePaise durationMinutes")
      .sort({ name: 1 })
      .lean();
    return res.status(200).json({
      services: services.map(({ _id, name, pricePaise, durationMinutes }) => ({
        _id,
        name,
        pricePaise,
        durationMinutes,
      })),
    });
  } catch (error) {
    console.error("Failed to load service options:", error);
    return res.status(500).json({ message: "Unable to load service options" });
  }
};

const getServiceById = async (req, res) => {
  try {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) {
      return res.status(400).json({ message: "Invalid service" });
    }
    // A direct lookup is tenant-scoped so service IDs cannot cross business boundaries.
    const service = await Service.findOne(tenantFilter(req, { _id: req.params.id }))
      .select("name pricePaise durationMinutes isActive createdAt updatedAt")
      .lean();
    if (!service) return res.status(404).json({ message: "Service not found" });
    return res.status(200).json({ service: toPublicService(service) });
  } catch (error) {
    console.error("Failed to load service:", error);
    return res.status(500).json({ message: "Unable to load service" });
  }
};

const createService = async (req, res) => {
  try {
    const serviceData = validateServiceCreation(req.body);
    // The server derives the business ID rather than accepting it from the request.
    const service = await Service.create(tenantData(req, serviceData));
    return res.status(201).json({
      message: "Service created successfully",
      service: toPublicService(service),
    });
  } catch (error) {
    if (error instanceof ServiceValidationError) {
      return res.status(400).json({ message: error.message });
    }
    if (error?.code === 11000) {
      return res.status(409).json({ message: "A service with this name already exists" });
    }
    console.error("Failed to create service:", error);
    return res.status(500).json({ message: "Unable to create service" });
  }
};

const updateService = async (req, res) => {
  try {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) {
      return res.status(400).json({ message: "Invalid service" });
    }
    const updateData = validateServiceUpdate(req.body);
    // Updates can affect only a service owned by the authenticated business.
    const service = await Service.findOne(tenantFilter(req, { _id: req.params.id }));
    if (!service) return res.status(404).json({ message: "Service not found" });
    if (updateData.hasName) service.name = updateData.name;
    if (updateData.hasPricePaise) service.pricePaise = updateData.pricePaise;
    if (updateData.hasDurationMinutes) service.durationMinutes = updateData.durationMinutes;
    if (updateData.hasIsActive) service.isActive = updateData.isActive;
    await service.save();
    return res.status(200).json({
      message: "Service updated successfully",
      service: toPublicService(service),
    });
  } catch (error) {
    if (error instanceof ServiceValidationError) {
      return res.status(400).json({ message: error.message });
    }
    if (error?.code === 11000) {
      return res.status(409).json({ message: "A service with this name already exists" });
    }
    console.error("Failed to update service:", error);
    return res.status(500).json({ message: "Unable to update service" });
  }
};

export {
  createService,
  getServiceById,
  getServiceOptions,
  getServices,
  updateService,
};
