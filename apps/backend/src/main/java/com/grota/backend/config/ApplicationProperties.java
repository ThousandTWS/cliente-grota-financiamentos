package com.grota.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Properties specific to Backend.
 * <p>
 * Properties are configured in the {@code application.yml} file.
 * See {@link tech.jhipster.config.JHipsterProperties} for a good example.
 */
@ConfigurationProperties(prefix = "application", ignoreUnknownFields = false)
public class ApplicationProperties {
    private final Cloudinary cloudinary = new Cloudinary();
    private final Keycloak keycloak = new Keycloak();

    public Cloudinary getCloudinary() {
        return cloudinary;
    }

    public Keycloak getKeycloak() {
        return keycloak;
    }

    public static class Cloudinary {

        private String cloudName;

        private String apiKey;

        private String apiSecret;

        private String dealerDocumentsFolder = "dealers";

        public String getCloudName() {
            return cloudName;
        }

        public void setCloudName(String cloudName) {
            this.cloudName = cloudName;
        }

        public String getApiKey() {
            return apiKey;
        }

        public void setApiKey(String apiKey) {
            this.apiKey = apiKey;
        }

        public String getApiSecret() {
            return apiSecret;
        }

        public void setApiSecret(String apiSecret) {
            this.apiSecret = apiSecret;
        }

        public String getDealerDocumentsFolder() {
            return dealerDocumentsFolder;
        }

        public void setDealerDocumentsFolder(String dealerDocumentsFolder) {
            this.dealerDocumentsFolder = dealerDocumentsFolder;
        }
    }

    public static class Keycloak {

        private String baseUrl = "http://localhost:9080";

        private String realm = "jhipster";

        private String adminRealm = "master";

        private String adminUsername = "admin";

        private String adminPassword = "admin";

        private String adminClientId = "admin-cli";

        public String getBaseUrl() {
            return baseUrl;
        }

        public void setBaseUrl(String baseUrl) {
            this.baseUrl = baseUrl;
        }

        public String getRealm() {
            return realm;
        }

        public void setRealm(String realm) {
            this.realm = realm;
        }

        public String getAdminRealm() {
            return adminRealm;
        }

        public void setAdminRealm(String adminRealm) {
            this.adminRealm = adminRealm;
        }

        public String getAdminUsername() {
            return adminUsername;
        }

        public void setAdminUsername(String adminUsername) {
            this.adminUsername = adminUsername;
        }

        public String getAdminPassword() {
            return adminPassword;
        }

        public void setAdminPassword(String adminPassword) {
            this.adminPassword = adminPassword;
        }

        public String getAdminClientId() {
            return adminClientId;
        }

        public void setAdminClientId(String adminClientId) {
            this.adminClientId = adminClientId;
        }
    }

    // jhipster-needle-application-properties-property
    // jhipster-needle-application-properties-property-getter
    // jhipster-needle-application-properties-property-class
}
