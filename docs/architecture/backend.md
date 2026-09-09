# Backend architecture

The Node.js/Express backend is located in `backend/src` and uses MongoDB through Mongoose.

## Current structure

```text
backend/src/
├── config/       # Environment and database configuration
├── controllers/  # Authentication controllers
├── middlewares/  # Authentication and authorization middleware
├── modules/      # Domain modules, including business registration
├── routes/       # Express route registration
└── server.js      # Application startup
```

## Tenant model

A business is the tenant boundary. Registration creates a `Business` and its `OWNER` user in one
MongoDB transaction. Future business-owned records must carry and enforce their business identity.
