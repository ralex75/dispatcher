//FISSI
querydip={"fissi":"SELECT \
	    persone.id AS id,\
	    '' as user, \
    	INITCAP(persone.nome) as nome, \
    	INITCAP(persone.cognome) as cognome,\
	UPPER(persone.\"codiceFiscale\") AS cdf, \
	INITCAP(ruoli.nome) as qualifica,\
	persone.email,\
    INITCAP(COALESCE(stanze.edificio,'')) AS edificio,\
    	SUBSTR(COALESCE(stanze.numero,''),1,1) as piano,\
    	COALESCE(stanze.numero,'') AS stanza,\
	ARRAY_TO_STRING(ARRAY(SELECT COALESCE(\"telefonoUfficio\",'') FROM posizione WHERE persone.id=persona),',') as tel1,\
	'' as tel2,\
	'' as fax,\
	INITCAP(enti.nome) AS ente,\
        CASE persone.\"fineRuoloCorrente\" \
        WHEN '1111-11-11'\
            THEN 'Attivo'\
            ELSE CASE WHEN now() < persone.\"fineRuoloCorrente\" \
        	THEN 'Attivo' \
        	ELSE 'Scaduto'\
    	    END\
        END as stato,\
	COALESCE (\
		CASE persone.\"fineRuoloCorrente\" \
	       	WHEN '1111-11-11' THEN 'n/d' \
	       	ELSE TO_CHAR(persone.\"fineRuoloCorrente\", 'YYYY-MM-DD') \
	    	END, 'n/d' \
	) as expire_date \
FROM \
	persone \
JOIN ruoli ON \
    persone.\"ruoloCorrente\" = ruoli.id \
JOIN persone AS referente ON \
    persone.\"personaRiferimento\" = referente.id \
JOIN persone AS responsabile ON \
    persone.responsabile = responsabile.id \
JOIN enti ON\
    enti.id = persone.\"enteAppartenenza\" \
LEFT JOIN \
(select * from posizione limit 1) as pos ON pos.persona = persone.id \
    LEFT JOIN \
    stanze ON stanze.id = pos.stanza \
WHERE  \
	ruoli.\"ruoloDaResponsabile\" = 't'",

"ospiti":"SELECT    \
    persone.id AS id, \
    INITCAP(persone.nome) as nome, \
    INITCAP(persone.cognome) as cognome,\
    CASE WHEN now() > persone.\"fineRuoloCorrente\"\
	THEN\
		CASE persone.\"fineRuoloCorrente\" \
			WHEN '1111-11-11' \
				THEN \
				CASE WHEN now() < persone.\"inizioRuoloCorrente\" \
					THEN 'NON Attivo' \
					ELSE 'Attivo'\
				END \
				|| ' - ' || \
				CASE persone.\"approvatoSegreteria\" WHEN 't' \
					THEN 'Autorizzato' \
					ELSE 'NON Autorizzato' \
				END \
			ELSE \
				'Scaduto'\
		END\
	ELSE \
		CASE WHEN now() < persone.\"inizioRuoloCorrente\" \
                        THEN 'NON Attivo' \
                        ELSE 'Attivo'\
                END \
                || ' - ' ||\
                CASE WHEN now() < persone.\"fineRuoloCorrente\" \
                        THEN CASE persone.\"approvatoSegreteria\" WHEN 't' \
                                THEN 'Autorizzato'\
                                ELSE 'NON Autorizzato'\
                             END\
                        ELSE 'Scaduto'\
                END\
    END AS stato,\
    INITCAP(persone.nazionalità) as nazionality, \
    INITCAP(ruoli.nome) as tipo, \
    ARRAY_TO_STRING(ARRAY(SELECT INITCAP(gruppi.nome) FROM afferenze,gruppi WHERE persone.id=afferenze.persona AND afferenze.gruppo=gruppi.id),',') as gruppo,\
    INITCAP(referente.nome || ' ' || referente.cognome) as referente,\
    INITCAP(responsabile.nome || ' ' || responsabile.cognome) as responsabile,\
    INITCAP(enti.nome) AS nomi_enti,\
    persone.\"inizioRuoloCorrente\" AS inizio_visita,\
    CASE persone.\"fineRuoloCorrente\"\
       WHEN '1111-11-11' THEN 'n/d' \
  	   ELSE TO_CHAR(persone.\"fineRuoloCorrente\", 'YYYY-MM-DD') \
    END AS fine_visita,\
    ARRAY_TO_STRING(ARRAY(SELECT COALESCE(\"telefonoUfficio\",'') from posizione where persone.id=persona),',') as tel1,\
    persone.email,\
    UPPER(persone.\"codiceFiscale\") AS cdf \
FROM \
    persone \
JOIN ruoli ON \
    persone.\"ruoloCorrente\" = ruoli.id \
JOIN persone AS referente ON \
    persone.\"personaRiferimento\" = referente.id \
JOIN persone as responsabile ON \
    persone.responsabile = responsabile.id \
JOIN enti ON \
    enti.id = persone.\"enteAppartenenza\" \
WHERE  \
    ruoli.\"ruoloDaResponsabile\" = 'f'"
}

module.exports={querydip}