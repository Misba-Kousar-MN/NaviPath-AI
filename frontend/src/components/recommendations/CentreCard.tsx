import React from 'react';
import { Building2, MapPin, Phone, Mail, Navigation } from 'lucide-react';
import { NearbyTrainingCentreOut } from '../../types/recommendation';
import { Badge } from '../ui/Badge';
import { useLanguage } from '../../context/LanguageContext';

interface CentreCardProps {
  centre: NearbyTrainingCentreOut;
}

export const CentreCard: React.FC<CentreCardProps> = ({ centre }) => {
  const { t } = useLanguage();

  const hasDistance = centre.distance_km !== null && centre.distance_km !== undefined;
  const isApproximate = centre.distance_type === 'approximate' || centre.distance_type === 'district_only';

  return (
    <div className="bg-white rounded-2xl border border-brand-border p-5 shadow-soft hover:shadow-medium transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-brand-soft-mint text-brand-deep-teal flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4 h-4" />
          </div>

          {/* Distance Badge strictly based on backend data */}
          {hasDistance ? (
            <Badge variant={isApproximate ? 'warning' : 'teal'} size="sm">
              <Navigation className="w-3 h-3" />
              <span>
                {centre.distance_km?.toFixed(1)} km {isApproximate ? `(${t.distanceApprox})` : t.distanceExact}
              </span>
            </Badge>
          ) : (
            <Badge variant="neutral" size="sm">
              {t.distanceUnavailable}
            </Badge>
          )}
        </div>

        <h4 className="text-base font-bold text-brand-text-dark mb-1">
          {centre.name || centre.centre_name}
        </h4>

        <div className="text-xs text-brand-text-muted mb-3 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-brand-deep-teal flex-shrink-0" />
          <span>
            {centre.taluk ? `${centre.taluk}, ` : ''}{centre.district}
          </span>
        </div>

        {centre.address && (
          <p className="text-xs text-brand-text-muted leading-relaxed mb-4 bg-brand-surface/60 p-2.5 rounded-xl border border-brand-border/60">
            {centre.address}
          </p>
        )}

        <div className="space-y-1.5 text-xs text-brand-text-muted">
          {centre.recognition_status && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-brand-text-dark">Status:</span>
              <span className="capitalize">{centre.recognition_status.replace('-', ' ')}</span>
            </div>
          )}

          {centre.contact_phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-brand-deep-teal" />
              <span>{centre.contact_phone}</span>
            </div>
          )}

          {centre.contact_email && (
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-brand-deep-teal" />
              <span>{centre.contact_email}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-brand-border/60">
        <span className="text-[11px] font-medium text-brand-deep-teal block">
          Authorized Training Location
        </span>
      </div>
    </div>
  );
};
