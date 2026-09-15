DriftGuard AI - A-to-Z Prototype Fix

This build fixes the prototype flow without changing the core project structure:
1. Dead-Reckoning exposes incremental distance and velocity to the dashboard.
2. DriftGuard distance no longer depends on a 0.5 m display threshold.
3. On laptops without motion sensors, Simulate GPS Loss automatically starts a clearly simulated demo motion feed if no real sensor data arrives.
4. Recover GPS stops demo motion.
5. OSRM overlay uses a conservative match request without synthetic timestamps, reducing 400 errors.
6. AI uses a local fallback by default, so the dashboard does not depend on a Python server for the prototype. Remote AI can be enabled with enableRemoteAI() when the server is configured.

For a real phone sensor demo, use HTTPS/localhost and grant motion/orientation permission. The laptop demo motion is simulation only.


Packaging improvements in this build:
7. AI server loads its model using an absolute path, so it can be launched from any working directory.
8. Added ai/requirements.txt and one-click Windows/Mac/Linux server launchers.
9. Added /health endpoint for a simple server check.
