import Client from "./client.model.js";
import { tenantData, tenantFilter } from "../../utils/tenant-scope.js";
import {
  ClientValidationError,
  validateClientCreation,
} from "./client.validation.js";

const getClientList = async (req, res) => {
  try {
    // Client records are always scoped to the authenticated business.
    const clients = await Client.find(tenantFilter(req))
      .select("name mobile email notes createdAt updatedAt")
      // Show recently added clients first, with an ID tie-breaker for records created at the same time.
      .sort({ createdAt: -1, _id: -1 })
      .lean();

    return res.status(200).json({ clients });
  } catch (error) {
    console.error("Failed to retrieve client list:", error);
    return res.status(500).json({ message: "Unable to retrieve client list" });
  }
};

const createClient = async (req, res) => {
  try {
    const clientData = validateClientCreation(req.body);

    await Client.create(tenantData(req, clientData));

    return res.status(201).json({ message: "Client created successfully" });
  } catch (error) {
    if (error instanceof ClientValidationError) {
      return res.status(400).json({ message: error.message });
    }

    console.error("Failed to create client:", error);
    return res.status(500).json({ message: "Unable to create client" });
  }
};

export { getClientList, createClient };
