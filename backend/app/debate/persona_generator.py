from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import PromptTemplate

# Prompt Template to generate a dynamic persona
PERSONA_PROMPT = """You are an expert debate coach and identity designer.
Given the debate topic below, invent a specific, highly credentialed professional identity (a "persona") perfectly suited to argue the given position assertively and persuasively.

For example, if the topic is Healthcare and the position is Pro, the persona might be: "A former federal health policy director and health economist who values systematic efficiency and views healthcare access as a fundamental human right."

Topic: {topic}
Position: {position}

Output ONLY a 2-3 sentence description characterizing this persona, how they speak, and what core values they appeal to. Do not include any other text or explanation.
"""

async def generate_persona(topic: str, position: str) -> str:
    """
    Calls Claude 3 Haiku to generate a dynamic persona tailored to the topic and side.
    """
    # Using Haiku for speed/cost for initial persona generation
    llm = ChatAnthropic(model_name="claude-3-haiku-20240307", temperature=0.7)
    
    prompt = PromptTemplate.from_template(PERSONA_PROMPT)
    chain = prompt | llm
    
    response = await chain.ainvoke({"topic": topic, "position": position})
    
    # Return the raw text content of the message
    return response.content.strip()
